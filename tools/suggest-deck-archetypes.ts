import 'dotenv/config';

import { getCollectionsByUser } from '@platform/db';
import { ANTI_PENALTY, SUPPORT_WEIGHT, scoreArchetypesForCollection } from '@platform/deck-builder';

const SEED_USER_ID = process.env['SEED_USER_ID'] ?? 'seed-user';
const SEED_COLLECTION_NAME = process.env['SEED_COLLECTION_NAME'] ?? 'Main';

async function main(): Promise<void> {
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

  const scored = await scoreArchetypesForCollection(collection.id);

  console.log(`Collection "${SEED_COLLECTION_NAME}" — archetype ranking`);
  console.log(`Scoring: core + ${SUPPORT_WEIGHT}×support − ${ANTI_PENALTY}×anti\n`);

  scored.forEach((row, i) => {
    const { core, support, anti, total } = row.score;
    const weak = core === 0 ? ' (weak — no core tag hits)' : '';
    console.log(
      `${i + 1}. ${row.archetype.name}${weak}  score=${total.toFixed(2)}  (core=${core}, support×${SUPPORT_WEIGHT}=${(SUPPORT_WEIGHT * support).toFixed(2)}, anti×${ANTI_PENALTY}=${(ANTI_PENALTY * anti).toFixed(2)})`,
    );
    console.log(`   ${row.archetype.description}`);
    // console.log(`   Gameplan: ${row.archetype.gameplan}`);
    // console.log(`   Win conditions: ${row.archetype.win_conditions.join(', ')}`);
    // console.log(`   Core tags: ${row.archetype.core_tags.join(', ')}`);
    // console.log(`   Support tags: ${row.archetype.support_tags.join(', ')}`);
    // console.log(`   Anti tags: ${row.archetype.anti_tags.join(', ')}\n`);
  });
}

main().catch((error: unknown) => {
  console.error('suggest-deck-archetypes failed:', error);
  process.exitCode = 1;
});
