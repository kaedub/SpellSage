import 'dotenv/config';

import { createReadStream, statSync } from 'node:fs';

import chain from 'stream-chain';
import parser from 'stream-json';
import { streamArray } from 'stream-json/streamers/stream-array.js';

import type { Card } from '@shared/types';
import { insertCards } from '@platform/db';
import { toCard } from '@platform/scryfall/transform';

const BATCH_SIZE = 200;

function resolveFilePath(): string {
    const arg = process.argv[2];
    if (arg === undefined || arg === '') {
        console.error('Usage: seed:bulk <path-to-scryfall-bulk-json>');
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
    let batch: Card[] = [];
    const skippedCards: Card[] = [];

    for await (const { value } of pipeline) {
        try {
            batch.push(toCard(value));
        } catch (err: unknown) {
            skipped++;
            if (skipped <= 10) {
                const id =
                    typeof value === 'object' &&
                    value !== null &&
                    'id' in value &&
                    typeof (value as Record<string, unknown>).id === 'string'
                        ? (value as Record<string, unknown>).id
                        : '<unknown>';
                const msg = err instanceof Error ? err.message : String(err);
                console.warn(`  ⚠ Skipped ${id}: ${msg}`);
                skippedCards.push(value);
            }
        }

        if (batch.length >= BATCH_SIZE) {
            await insertCards(batch);
            inserted += batch.length;
            batch = [];

            const pct = ((fileStream.bytesRead / fileSize) * 100).toFixed(1);
            process.stdout.write(
                `\r  ${pct}% — ${inserted.toLocaleString()} inserted, ${skipped.toLocaleString()} skipped`,
            );
        }
    }

    if (batch.length > 0) {
        await insertCards(batch);
        inserted += batch.length;
    }

    console.log(
        `\n\nDone. Inserted ${inserted.toLocaleString()} cards, skipped ${skipped.toLocaleString()}.`,
    );
    console.log(JSON.stringify(skippedCards));
    console.log(`Skipped cards: ${skippedCards.length}`);
}

main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});
