import 'dotenv/config';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
    parseCollectionText,
    type CollectionTextEntry,
} from '@shared/collection-text';
import {
    findCardsByCollectorInfo,
    upsertCollectionEntries,
} from '@platform/db';

const SEED_USER_ID = process.env['SEED_USER_ID'] ?? 'seed-user';
const BATCH_SIZE = 200;

function loadCollectionFile(): string {
    const filePath = process.argv[2] ?? resolve(__dirname, 'collection.txt');
    console.log(`Reading collection from ${filePath}…`);
    return readFileSync(filePath, 'utf-8');
}

async function main(): Promise<void> {
    const text = loadCollectionFile();
    const cardMap = parseCollectionText(text);

    console.log(`Parsed ${cardMap.size} unique cards from collection text.\n`);

    const lookupEntries = [...cardMap.entries()].map(([, entries]) => {
        const first = entries[0];
        return { name: first.name, set: first.setCode, collectorNum: first.collectorNum };
    });

    const cardIdMap = await findCardsByCollectorInfo(lookupEntries);
    console.log(`Resolved ${cardIdMap.size} / ${cardMap.size} cards in the database.\n`);

    const upsertRows: Array<{
        userId: string;
        cardId: string;
        quantity: number;
        foil: boolean;
    }> = [];
    const unresolved: CollectionTextEntry[] = [];

    for (const [key, entries] of cardMap) {
        const cardId = cardIdMap.get(key);
        if (!cardId) {
            unresolved.push(...entries);
            continue;
        }

        for (const entry of entries) {
            upsertRows.push({
                userId: SEED_USER_ID,
                cardId,
                quantity: entry.quantity,
                foil: entry.foil,
            });
        }
    }

    let inserted = 0;
    for (let i = 0; i < upsertRows.length; i += BATCH_SIZE) {
        const batch = upsertRows.slice(i, i + BATCH_SIZE);
        inserted += await upsertCollectionEntries(batch);
        process.stdout.write(
            `\r  Upserted ${inserted} / ${upsertRows.length} collection entries`,
        );
    }

    console.log('\n');

    if (unresolved.length > 0) {
        console.log(`Unresolved cards (${unresolved.length}):`);
        for (const entry of unresolved.slice(0, 20)) {
            console.log(`  ${entry.quantity} ${entry.name} (${entry.setCode}) ${entry.collectorNum}${entry.foil ? ' *F*' : ''}`);
        }
        if (unresolved.length > 20) {
            console.log(`  … and ${unresolved.length - 20} more`);
        }
    }

    console.log(
        `Done. Upserted ${inserted} entries for user "${SEED_USER_ID}", ${unresolved.length} unresolved.`,
    );
}

main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});
