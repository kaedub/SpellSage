import 'dotenv/config';

import {
  upsertCardTags,
  findUntaggedCollectionCards,
  loadTagTaxonomy,
} from '@platform/db';
import { structuredCompletion, createCardTaggingService } from '@ai';

const TAG_SOURCE = 'v0.0.1';
const BATCH_SIZE = Number(process.env['TAG_BATCH_SIZE']) || 4000;

async function main(): Promise<void> {
  const taxonomyResult = await loadTagTaxonomy();
  if (!taxonomyResult.ok) {
    console.error(`Failed to load tag taxonomy [${taxonomyResult.error.kind}]:`, taxonomyResult.error);
    process.exit(1);
  }

  const taxonomy = taxonomyResult.value;
  console.log(`Loaded ${taxonomy.allSlugs.length} tags across ${taxonomy.groups.length} groups from DB`);

  const tagger = createCardTaggingService({
    completion: structuredCompletion,
    taxonomy,
  });

  const cardsResult = await findUntaggedCollectionCards(BATCH_SIZE);
  if (!cardsResult.ok) {
    console.error(`Failed to find untagged cards [${cardsResult.error.kind}]:`, cardsResult.error);
    process.exit(1);
  }

  const cards = cardsResult.value;

  if (cards.length === 0) {
    console.log('No untagged cards with oracle text found in collection.');
    return;
  }

  console.log(`Found ${cards.length} untagged cards to process (source: ${TAG_SOURCE})\n`);

  for (const card of cards) {
    console.log(`${'='.repeat(60)}`);
    console.log(`  ${card.name} ${card.manaCost ?? ''}`);
    console.log(`  ${card.typeLine}`);
    if (card.oracleText) {
      console.log(`  "${card.oracleText}"`);
    }
    console.log(`${'='.repeat(60)}`);

    const result = await tagger.tagCard(card);

    if (!result.ok) {
      console.error(`  ERROR [${result.error.kind}]:`, result.error);
      continue;
    }

    const { tags, usage } = result.value;

    if (tags.length === 0) {
      console.log('  (no tags assigned)');
    } else {
      for (const t of tags) {
        console.log(`  ${t.tag.padEnd(25)} ${t.confidence.toFixed(2)}  "${t.evidence}"`);
      }
    }

    console.log(`  tokens: ${usage.promptTokens} in / ${usage.completionTokens} out / ${usage.totalTokens} total`);

    const saveResult = await upsertCardTags(
      card.id,
      TAG_SOURCE,
      tags.map(t => ({ tagSlug: t.tag, confidence: t.confidence, evidence: t.evidence })),
    );

    if (!saveResult.ok) {
      console.error(`  SAVE ERROR [${saveResult.error.kind}]:`, saveResult.error);
    } else {
      const { inserted, deleted } = saveResult.value;
      console.log(`  saved: ${inserted} inserted, ${deleted} previous deleted`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
