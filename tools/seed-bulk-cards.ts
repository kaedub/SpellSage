import 'dotenv/config';

import { homedir } from 'node:os';
import { join } from 'node:path';
import { createReadStream, statSync } from 'node:fs';

import chain from 'stream-chain';
import parser from 'stream-json';
import { streamArray } from 'stream-json/streamers/stream-array.js';

import { insertCards, insertOracleCards } from '@platform/db';
import { toCard, toOracleCard } from '@platform/scryfall/transform';
import type { CardPrinting, OracleCard } from '@shared/types';
import type { ScryfallCard } from '../libs/platform/adapters/scryfall/types';

const DEFAULT_BATCH_SIZE = 50;

type EnvPathKey = 'ORACLE_CARDS_PATH' | 'DEFAULT_CARDS_PATH' | 'ALL_CARDS_PATH';

function expandHome(path: string): string {
    if (path === '~') {
        return homedir();
    }
    if (path.startsWith('~/')) {
        return join(homedir(), path.slice(2));
    }
    return path;
}

function resolveRequiredEnvPath(key: EnvPathKey): string {
    const value = process.env[key]?.trim();
    if (value === undefined || value === '') {
        throw new Error(`Missing required env var ${key}`);
    }
    return expandHome(value);
}

function resolveCardPrintingPath(): string {
    const defaultPath = process.env.DEFAULT_CARDS_PATH?.trim();
    if (defaultPath !== undefined && defaultPath !== '') {
        return expandHome(defaultPath);
    }
    const allCardsPath = process.env.ALL_CARDS_PATH?.trim();
    if (allCardsPath !== undefined && allCardsPath !== '') {
        return expandHome(allCardsPath);
    }
    throw new Error('Missing DEFAULT_CARDS_PATH (or fallback ALL_CARDS_PATH) in .env');
}

function resolveBatchSize(): number {
    const value = process.env.SEED_BATCH_SIZE?.trim();
    if (value === undefined || value === '') {
        return DEFAULT_BATCH_SIZE;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`SEED_BATCH_SIZE must be a positive integer, got "${value}"`);
    }

    return parsed;
}

type SeedJob<TCard> = {
    readonly label: string;
    readonly filePath: string;
    readonly transform: (raw: ScryfallCard) => TCard;
    readonly insertBatch: (batch: TCard[]) => Promise<void>;
};

async function runSeedJob<TCard>(job: SeedJob<TCard>): Promise<void> {
    const fileSize = statSync(job.filePath).size;
    console.log(
        `Streaming ${job.label}: ${job.filePath} (${(fileSize / 1e6).toFixed(0)} MB)…\n`,
    );

    const fileStream = createReadStream(job.filePath);
    const pipeline = chain([fileStream, parser(), streamArray()]);

    let inserted = 0;
    let skipped = 0;
    const batchSize = resolveBatchSize();
    let batch: TCard[] = [];
    const skippedIds: string[] = [];

    for await (const { value } of pipeline) {
        try {
            batch.push(job.transform(value as ScryfallCard));
        } catch (err: unknown) {
            skipped++;
            if (skipped <= 10) {
                const rec =
                    typeof value === 'object' && value !== null
                        ? (value as Record<string, unknown>)
                        : null;
                const rawId = rec?.id;
                const id = typeof rawId === 'string' ? rawId : '<unknown>';
                const msg = err instanceof Error ? err.message : String(err);
                console.warn(`  ⚠ Skipped ${id}: ${msg}`);
                if (skippedIds.length < 10) {
                    skippedIds.push(id);
                }
            }
        }

        if (batch.length >= batchSize) {
            await job.insertBatch(batch);
            inserted += batch.length;
            batch = [];

            const pct = ((fileStream.bytesRead / fileSize) * 100).toFixed(1);
            process.stdout.write(
                `\r  ${job.label} ${pct}% — ${inserted.toLocaleString()} inserted, ${skipped.toLocaleString()} skipped`,
            );
        }
    }

    if (batch.length > 0) {
        await job.insertBatch(batch);
        inserted += batch.length;
    }

    console.log(
        `\n\nDone ${job.label}. Inserted ${inserted.toLocaleString()}, skipped ${skipped.toLocaleString()}.`,
    );
    if (skippedIds.length > 0) {
        console.log(`First skipped ids (${job.label}):`, skippedIds.join(', '));
    }
}

async function main(): Promise<void> {
    const oracleCardsPath = resolveRequiredEnvPath('ORACLE_CARDS_PATH');
    const cardPrintingsPath = resolveCardPrintingPath();

    await runSeedJob<OracleCard>({
        label: 'oracle cards',
        filePath: oracleCardsPath,
        transform: toOracleCard,
        insertBatch: insertOracleCards,
    });

    await runSeedJob<CardPrinting>({
        label: 'card printings',
        filePath: cardPrintingsPath,
        transform: toCard,
        insertBatch: insertCards,
    });
}

main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});
