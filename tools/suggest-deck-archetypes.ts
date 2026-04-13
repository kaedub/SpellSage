import 'dotenv/config';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getCollectionCardInventoryStats,
  getCollectionDistinctTaggedCardCount,
  getCollectionTagAggregates,
  getCollectionsByUser,
  loadTagTaxonomy,
} from '@platform/db';

import {
  ANTI_PENALTY,
  archetypeSlugsMissingFromTaxonomy,
  buildSignalMapFromAggregates,
  loadArchetypesFile,
  scoreAndSortArchetypes,
  SUPPORT_WEIGHT,
} from './deck-archetype-ranking';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SEED_USER_ID = process.env['SEED_USER_ID'] ?? 'seed-user';
const SEED_COLLECTION_NAME = process.env['SEED_COLLECTION_NAME'] ?? 'Main';
const TOP_TAGS = Math.max(1, Number(process.env['TOP_TAGS']) || 20);

async function main(): Promise<void> {
  const archetypesPath = path.resolve(__dirname, 'archetypes.json');
  const rawJson: unknown = JSON.parse(await readFile(archetypesPath, 'utf8'));
  const { archetypes } = loadArchetypesFile(rawJson);

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

  const [inventoryResult, taggedCountResult, aggregatesResult] = await Promise.all([
    getCollectionCardInventoryStats(collectionId),
    getCollectionDistinctTaggedCardCount(collectionId),
    getCollectionTagAggregates(collectionId),
  ]);

  if (!inventoryResult.ok) {
    console.error(`Failed to load collection inventory [${inventoryResult.error.kind}]:`, inventoryResult.error.message);
    process.exit(1);
  }
  if (!taggedCountResult.ok) {
    console.error(`Failed to count tagged cards [${taggedCountResult.error.kind}]:`, taggedCountResult.error.message);
    process.exit(1);
  }
  if (!aggregatesResult.ok) {
    console.error(`Failed to load tag aggregates [${aggregatesResult.error.kind}]:`, aggregatesResult.error.message);
    process.exit(1);
  }

  const inventory = inventoryResult.value;
  const distinctTagged = taggedCountResult.value;
  const aggregates = aggregatesResult.value;

  const groupBySlug = new Map<string, string>();
  for (const g of taxonomyResult.value.groups) {
    for (const t of g.tags) {
      groupBySlug.set(t.slug, g.slug);
    }
  }

  console.log(`Collection "${SEED_COLLECTION_NAME}" (id=${collectionId}) for user "${SEED_USER_ID}"`);

  console.log('Collection overview');
  console.log(`  Collection rows: ${inventory.collectionCardRows}`);
  console.log(`  Distinct cards: ${inventory.distinctCards}`);
  console.log(`  Total quantity (sum of row quantities): ${inventory.totalQuantity}`);
  console.log(`  Distinct cards with ≥1 tag: ${distinctTagged}`);
  if (inventory.distinctCards > 0 && distinctTagged === 0) {
    console.log(
      '\n  No tags found for cards in this collection. Run `yarn tag:cards` (and ensure cards are tagged) then retry.\n',
    );
  }
  if (inventory.collectionCardRows === 0) {
    console.log('\n  Collection is empty. Seed with `yarn seed:collection` or add cards.\n');
  }

  console.log(`\nTop ${Math.min(TOP_TAGS, aggregates.length)} tags by distinct cards in collection`);
  if (aggregates.length === 0) {
    console.log('  (none)\n');
  } else {
    for (const row of aggregates.slice(0, TOP_TAGS)) {
      const grp = groupBySlug.get(row.tagSlug) ?? '?';
      console.log(
        `  ${row.tagSlug.padEnd(28)}  group=${grp.padEnd(14)}  distinct=${String(row.distinctCards).padStart(4)}  qty=${row.totalQuantity}`,
      );
    }
    console.log('');
  }

  const signal = buildSignalMapFromAggregates(aggregates);
  const scored = scoreAndSortArchetypes(archetypes, signal);

  console.log('Suggested deck archetypes (ranked by tag fit; distinct-card counts)');
  console.log(`  Scoring: core + ${SUPPORT_WEIGHT}×support − ${ANTI_PENALTY}×anti\n`);

  let rank = 1;
  for (const row of scored) {
    const label = row.weak ? ' (weak — no core tag hits)' : '';
    console.log(
      `${rank}. ${row.archetype.name}${label}  score=${row.total.toFixed(2)}  (core=${row.core}, support×${SUPPORT_WEIGHT}=${(SUPPORT_WEIGHT * row.support).toFixed(2)}, anti×${ANTI_PENALTY}=${(ANTI_PENALTY * row.anti).toFixed(2)})`,
    );
    console.log(`   ${row.archetype.description}`);
    rank += 1;
  }
}

main().catch((error: unknown) => {
  console.error('suggest-deck-archetypes failed:', error);
  process.exitCode = 1;
});
