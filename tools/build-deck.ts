import 'dotenv/config';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import {
  getCollectionDistinctTaggedCardCount,
  getCollectionTagAggregates,
  getCollectionsByUser,
  loadTagTaxonomy,
} from '@platform/db';

import {
  archetypeSlugsMissingFromTaxonomy,
  buildSignalMapFromAggregates,
  loadArchetypesFile,
  scoreAndSortArchetypes,
} from './deck-archetype-ranking';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  readonly cards: readonly { readonly cardId: string;  readonly name: string; readonly quantity: number }[];
};

async function generateDeck(archetype: string, collectionId: number): Promise<DeckList> {
  console.log(`Generating deck for archetype "${archetype}" and collection "${collectionId}"`);

  /**
   * Generate a deck for the given archetype and collection.
   * 
   * First look up the needed tags for this archetype and creatue buckets for each group of cards in the deck 
   */

  return Promise.resolve({
    name: 'Deck',
    description: 'Deck',
    cards: [],  
  });
}

async function main(): Promise<void> {
  if (!input.isTTY) {
    console.error('This script requires an interactive terminal (stdin must be a TTY).');
    process.exit(1);
  }

  const archetypesPath = path.resolve(__dirname, 'archetypes.json');
  const rawJson: unknown = JSON.parse(await readFile(archetypesPath, 'utf8'));
  const { archetypes } = loadArchetypesFile(rawJson);
  if (archetypes.length === 0) {
    console.error('archetypes.json contains no archetypes.');
    process.exit(1);
  }

  const taxonomyResult = await loadTagTaxonomy();
  if (!taxonomyResult.ok) {
    console.error(`Failed to load tag taxonomy [${taxonomyResult.error.kind}]:`, taxonomyResult.error);
    process.exit(1);
  }
  const taxonomySlugs = new Set(taxonomyResult.value.allSlugs);

  const unknownSlugs = archetypeSlugsMissingFromTaxonomy(archetypes, taxonomySlugs);
  if (unknownSlugs.length > 0) {
    const preview = unknownSlugs.slice(0, 15).join(', ');
    const suffix = unknownSlugs.length > 15 ? '…' : '';
    console.warn(
      `Warning: ${unknownSlugs.length} tag slug(s) in archetypes.json are not in the DB taxonomy (scored as 0): ${preview}${suffix}\n`,
    );
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

  const [taggedCountResult, aggregatesResult] = await Promise.all([
    getCollectionDistinctTaggedCardCount(collectionId),
    getCollectionTagAggregates(collectionId),
  ]);

  if (!taggedCountResult.ok) {
    console.error(`Failed to count tagged cards [${taggedCountResult.error.kind}]:`, taggedCountResult.error.message);
    process.exit(1);
  }
  if (!aggregatesResult.ok) {
    console.error(`Failed to load tag aggregates [${aggregatesResult.error.kind}]:`, aggregatesResult.error.message);
    process.exit(1);
  }

  const distinctTagged = taggedCountResult.value;
  const aggregates = aggregatesResult.value;

  console.log(`Deck builder — collection "${SEED_COLLECTION_NAME}" (id=${collectionId}) for user "${SEED_USER_ID}"`);
  if (distinctTagged === 0) {
    console.log('Note: no tagged cards in this collection yet; archetype scores may be flat. Run `yarn tag:cards` if needed.\n');
  } else {
    console.log('');
  }

  const signal = buildSignalMapFromAggregates(aggregates);
  const scored = scoreAndSortArchetypes(archetypes, signal);
  const top = scored.slice(0, TOP_ARCHETYPES);
  const displayCount = top.length;
  if (displayCount === 0) {
    console.error('No scored archetypes to display.');
    process.exit(1);
  }

  console.log(`Top ${displayCount} archetypes for your collection (by tag fit):\n`);
  top.forEach((row, i) => {
    const label = row.weak ? ' (weak)' : '';
    console.log(`${i + 1}. ${row.archetype.name}${label} — score ${row.total.toFixed(2)}`);
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
  console.log(`Deck: ${deck}`);

}

main().catch((error: unknown) => {
  console.error('build-deck failed:', error);
  process.exitCode = 1;
});
