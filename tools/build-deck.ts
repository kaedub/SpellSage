import 'dotenv/config';

import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

import { getCollectionsByUser } from '@platform/db';
import {
  scoreArchetypesForCollection,
  ANTI_PENALTY,
  SUPPORT_WEIGHT,
  filterCandidatePool,
  type Bucket,
} from '@platform/deck-builder';
import { ARCHETYPES } from 'libs/platform/services/deck-builder/constants/archetypes';


const SEED_USER_ID = process.env['SEED_USER_ID'] ?? 'seed-user';
const SEED_COLLECTION_NAME = process.env['SEED_COLLECTION_NAME'] ?? 'Main';
const TOP_ARCHETYPES = 10;


async function promptArchetypeIndex(max: number): Promise<number> {
  const rl = createInterface({ input, output });
  try {
    for (;;) {
      const line = await rl.question(`Enter the number of your chosen archetype (1–${max}): `);
      const n = Number.parseInt(line.trim(), 10);
      if (Number.isInteger(n) && n >= 1 && n <= max) {
        return n;
      }
      console.log(`Invalid input. Enter an integer from 1 to ${max}.`);
    }
  } finally {
    rl.close();
  }
}

type DeckList = {
  readonly name: string;
  readonly description: string;
  readonly cards: readonly { readonly cardId: string; readonly name: string; readonly quantity: number }[];
};

async function generateDeck(archetype: string, collectionId: number): Promise<DeckList> {
  console.log(`Generating deck for archetype "${archetype}" and collection "${collectionId}"`);

  /**
   * Generate a deck for the given archetype and collection.
   *
   * 
   */

  const archetypeRow = ARCHETYPES.archetypes.find((a) => a.name === archetype);
  if (archetypeRow === undefined) {
    throw new Error(`Archetype "${archetype}" not found.`);
  }
  const candidatePool = await filterCandidatePool(collectionId, archetypeRow);
  console.log(`Candidate pool: ${candidatePool.length} cards`);
  // Count by primary bucket (first in array); also surface multi-bucket cards.
  const bucketCounts = new Map<Bucket, number>();
  let multiBucketCount = 0;
  const bucketMap = new Map<Bucket, {name: string, quantity: number}[]>();
  for (const c of candidatePool) {
    const primary = c.buckets[0];
    bucketCounts.set(primary, (bucketCounts.get(primary) ?? 0) + 1);
    if (c.buckets.length > 1) {
      multiBucketCount += 1;
    }
    bucketMap.set(primary, [...(bucketMap.get(primary) ?? []), { name: c.card.name, quantity: c.quantity }]);
  }
  console.log(
    `Buckets — threat=${bucketCounts.get('threat') ?? 0} interaction=${bucketCounts.get('interaction') ?? 0} utility=${bucketCounts.get('utility') ?? 0} land=${bucketCounts.get('land') ?? 0} (${multiBucketCount} multi-role)`,
  );
  for (const [bucket, cards] of bucketMap.entries()) {
    console.log(`  ${bucket}: ${cards.map((c) => `${c.name} (${c.quantity})`).slice(0, 10).join(', ')}`);
  }
  const deck = {
    name: archetype,
    description: archetypeRow.description,
    cards: candidatePool.map((c) => ({
      cardId: c.card.id,
      name: c.card.name,
      quantity: c.quantity,
    })),
  }

  return Promise.resolve(deck);
}

async function main(): Promise<void> {
  if (!input.isTTY) {
    console.error('This script requires an interactive terminal (stdin must be a TTY).');
    process.exit(1);
  }

  const listResult = await getCollectionsByUser(SEED_USER_ID);
  if (!listResult.ok) {
    console.error(`Failed to list collections [${listResult.error.kind}]:`, listResult.error.message);
    process.exit(1);
  }

  const collection = listResult.value.find((c) => c.name === SEED_COLLECTION_NAME);
  if (collection === undefined) {
    console.error(
      `No collection named "${SEED_COLLECTION_NAME}" for user "${SEED_USER_ID}". Create or seed one first.`,
    );
    process.exit(1);
  }

  const collectionId = collection.id;

  const scored = await scoreArchetypesForCollection(collectionId);

  console.log(`Deck builder — collection "${SEED_COLLECTION_NAME}" (id=${collectionId}) for user "${SEED_USER_ID}"`);

  const top = scored.slice(0, TOP_ARCHETYPES);
  const displayCount = top.length;
  if (displayCount === 0) {
    console.error('No scored archetypes to display.');
    process.exit(1);
  }

  console.log(`Top ${displayCount} archetypes for your collection (by tag fit):\n`);
  top.forEach((row, i) => {
    const { core, support, anti, total } = row.score;
    const weak = core === 0 ? ' (weak — no core tag hits)' : '';
    console.log(
      `${i + 1}. ${row.archetype.name}${weak}  score=${total.toFixed(2)}  (core=${core}, support×${SUPPORT_WEIGHT}=${(SUPPORT_WEIGHT * support).toFixed(2)}, anti×${ANTI_PENALTY}=${(ANTI_PENALTY * anti).toFixed(2)})`,
    );
    console.log(`   ${row.archetype.description}`);
  });
  console.log('');

  const choice = await promptArchetypeIndex(displayCount);
  const selected = top[choice - 1];
  if (selected === undefined) {
    console.error('Internal error: selection out of range.');
    process.exit(1);
  }
  console.log(`Selected: ${selected.archetype.name}`);
  console.log('Deck building coming soon....');

  const deck = await generateDeck(selected.archetype.name, collectionId);
  console.log(`Deck: ${deck.name}`);
  console.log(`Description: ${deck.description}`);
  console.log(`Cards:\n${deck.cards.map((c) => `    - ${c.name} (${c.quantity})`).slice(0, 10).join('\n')}`);
}

main().catch((error: unknown) => {
  console.error('build-deck failed:', error);
  process.exitCode = 1;
});
