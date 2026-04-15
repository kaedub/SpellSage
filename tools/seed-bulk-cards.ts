import 'dotenv/config';

import { createReadStream, statSync } from 'node:fs';

import chain from 'stream-chain';
import parser from 'stream-json';
import { streamArray } from 'stream-json/streamers/stream-array.js';

import type { OracleCard } from '@shared/types';
import { insertOracleCards } from '@platform/db';
import { toOracleCard } from '@platform/scryfall/transform';
import type { ScryfallCard } from '../libs/platform/adapters/scryfall/types';

const BATCH_SIZE = 200;

function resolveFilePath(): string {
    const arg = process.argv[2];
    if (arg === undefined || arg === '') {
        console.error(
            'Usage: yarn seed:bulk <path-to-scryfall-oracle_cards-bulk.json>',
        );
        process.exit(1);
    }
    return arg;
}

async function main(): Promise<void> {
    const filePath = resolveFilePath();
    const fileSize = statSync(filePath).size;

    console.log(
        `Streaming ${filePath} (${(fileSize / 1e6).toFixed(0)} MB)…\n`,
    );

    const fileStream = createReadStream(filePath);
    const pipeline = chain([fileStream, parser(), streamArray()]);

    let inserted = 0;
    let skipped = 0;
    let batch: OracleCard[] = [];
    const skippedIds: string[] = [];

    for await (const { value } of pipeline) {
        try {
            batch.push(toOracleCard(value as ScryfallCard));
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

        if (batch.length >= BATCH_SIZE) {
            await insertOracleCards(batch);
            inserted += batch.length;
            batch = [];

            const pct = ((fileStream.bytesRead / fileSize) * 100).toFixed(1);
            process.stdout.write(
                `\r  ${pct}% — ${inserted.toLocaleString()} inserted, ${skipped.toLocaleString()} skipped`,
            );
        }
    }

    if (batch.length > 0) {
        await insertOracleCards(batch);
        inserted += batch.length;
    }

    console.log(
        `\n\nDone. Inserted ${inserted.toLocaleString()} oracle cards, skipped ${skipped.toLocaleString()}.`,
    );
    if (skippedIds.length > 0) {
        console.log('First skipped ids:', skippedIds.join(', '));
    }
}

main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});
