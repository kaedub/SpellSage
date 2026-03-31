import 'dotenv/config';

import { searchCards } from '@platform/db';
import type { CardSearchFilter, CardSearchResult } from '@shared/search';

async function runQuery(label: string, filter: CardSearchFilter): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${'='.repeat(60)}`);
  console.log('Filter:', JSON.stringify(filter, null, 2));

  const result = await searchCards(filter);

  if (!result.ok) {
    console.error(`  ERROR [${result.error.kind}]: ${result.error.message}`);
    return;
  }

  printResult(result.value);
}

function printResult(result: CardSearchResult): void {
  console.log(`  ${result.total} total results (showing ${result.cards.length})\n`);
  for (const card of result.cards) {
    const cost = card.manaCost ?? '';
    const stats =
      card.power !== null && card.toughness !== null
        ? ` [${card.power}/${card.toughness}]`
        : '';
    console.log(`  ${card.name} ${cost}${stats}`);
    console.log(`    ${card.typeLine}`);
    if (card.oracleText) {
      const preview = card.oracleText.length > 80
        ? card.oracleText.slice(0, 80) + '...'
        : card.oracleText;
      console.log(`    "${preview}"`);
    }
  }
}

async function main(): Promise<void> {
  // 1. Name search
  await runQuery('Name search: "Lightning Bolt"', {
    name: 'Lightning Bolt',
    pagination: { limit: 5, offset: 0 },
  });

  // 2. Color exact match — mono-red cards
  await runQuery('Mono-red creatures with power >= 4, cmc <= 3', {
    colors: { mode: 'exact', values: ['R'] },
    types: ['Creature'],
    power: { gte: 4 },
    cmc: { lte: 3 },
    pagination: { limit: 10, offset: 0 },
  });

  // 3. Green creatures with flying (unusual combo)
  await runQuery('Green creatures with Flying', {
    colors: { mode: 'includes', values: ['G'] },
    types: ['Creature'],
    keywords: ['Flying'],
    pagination: { limit: 10, offset: 0 },
    sort: { field: 'cmc', direction: 'asc' },
  });

  // 4. Oracle text search — cards that draw cards
  await runQuery('Oracle text: "draw a card" + "enters"', {
    oracleText: ['draw a card', 'enters'],
    pagination: { limit: 10, offset: 0 },
  });

  // 5. Zombie tribal
  await runQuery('Zombie creatures, sorted by cmc', {
    subtypes: ['Zombie'],
    types: ['Creature'],
    sort: { field: 'cmc', direction: 'asc' },
    pagination: { limit: 10, offset: 0 },
  });

  // 6. Cheap black removal (oracle text heuristic)
  await runQuery('Black instants with "destroy" in text, cmc <= 3', {
    colors: { mode: 'includes', values: ['B'] },
    types: ['Instant'],
    oracleText: ['destroy'],
    cmc: { lte: 3 },
    pagination: { limit: 10, offset: 0 },
  });

  // 7. Mana dorks — green creatures that produce mana
  await runQuery('Green creatures that produce mana, cmc <= 2', {
    colors: { mode: 'includes', values: ['G'] },
    types: ['Creature'],
    producedMana: ['G'],
    cmc: { lte: 2 },
    sort: { field: 'numericPower', direction: 'desc' },
    pagination: { limit: 10, offset: 0 },
  });

  // 8. Legendary creatures for commander
  await runQuery('Legendary creatures with cmc 3-5, sorted by name', {
    isLegendary: true,
    types: ['Creature'],
    cmc: { gte: 3, lte: 5 },
    sort: { field: 'name', direction: 'asc' },
    pagination: { limit: 10, offset: 0 },
  });

  // 9. Big beaters
  await runQuery('Creatures with power >= 7 and toughness >= 7', {
    types: ['Creature'],
    power: { gte: 7 },
    toughness: { gte: 7 },
    sort: { field: 'cmc', direction: 'asc' },
    pagination: { limit: 10, offset: 0 },
  });

  // 10. Equipment search
  await runQuery('Equipment cards', {
    subtypes: ['Equipment'],
    sort: { field: 'cmc', direction: 'asc' },
    pagination: { limit: 10, offset: 0 },
  });

  const USER_ID = process.env.SEED_USER_ID ?? 'seed-user';

  // 11. Collection: all cards I own
  await runQuery(`Collection: all cards owned by "${USER_ID}"`, {
    collection: { userId: USER_ID },
    sort: { field: 'name', direction: 'asc' },
    pagination: { limit: 10, offset: 0 },
  });

  // 12. Collection: creatures I own with cmc <= 3
  await runQuery('Collection: cheap creatures I own (cmc <= 3)', {
    collection: { userId: USER_ID },
    types: ['Creature'],
    cmc: { lte: 3 },
    sort: { field: 'cmc', direction: 'asc' },
    pagination: { limit: 10, offset: 0 },
  });

  // 13. Collection: cards I own that draw cards
  await runQuery('Collection: cards I own with "draw a card" in text', {
    collection: { userId: USER_ID },
    oracleText: ['draw a card'],
    pagination: { limit: 10, offset: 0 },
  });

  // 14. Collection: cards I own at least 2 copies of
  await runQuery('Collection: cards I own 2+ copies of', {
    collection: { userId: USER_ID, minQuantity: 2 },
    sort: { field: 'name', direction: 'asc' },
    pagination: { limit: 10, offset: 0 },
  });

  // 15. Collection: green cards I own 2+ copies of
  await runQuery('Collection: green cards I own 2+ copies of', {
    collection: { userId: USER_ID, minQuantity: 2 },
    colors: { mode: 'includes', values: ['G'] },
    sort: { field: 'name', direction: 'asc' },
    pagination: { limit: 10, offset: 0 },
  });

  // 16. Empty filter — just returns cards sorted by name
  await runQuery('No filters (first 5 cards by name)', {
    pagination: { limit: 5, offset: 0 },
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
