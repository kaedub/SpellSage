import 'dotenv/config';

import type { CardPrinting } from '@shared/types';
import { getRandomCard } from '@platform/clients/scryfall';
import { insertCards } from '@platform/db';
import { toCard } from '@platform/scryfall/transform';

const BATCH_SIZE = 10;
const DELAY_MS = 120;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
    const rows: CardPrinting[] = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
        const raw = await getRandomCard();
        rows.push(toCard(raw));
        if (i < BATCH_SIZE - 1) {
            await sleep(DELAY_MS);
        }
    }
    await insertCards(rows);
    console.log(
        `Upserted ${rows.length} cards:`,
        rows.map((r) => r.id).join(', ')
    );
}

main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});
