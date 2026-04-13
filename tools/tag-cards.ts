import 'dotenv/config';

import {
  upsertCardTags,
  findUntaggedCards,
  getTaggingQueueStats,
  isCardEligibleForLlmTagging,
  loadTagTaxonomy,
} from '@platform/db';
import { structuredCompletion, createCardTaggingService } from '@ai';

const TAG_SOURCE = 'v0.0.1';
const BATCH_SIZE = Number(process.env['TAG_BATCH_SIZE']) || 20000;

type TaggerTagRow = { readonly tag: string; readonly confidence: number; readonly evidence: string };

/**
 * One DB row per slug per source; merge duplicate slugs using max confidence and combined evidence.
 */
function collapseDuplicateTags(tags: readonly TaggerTagRow[]): Array<{
  tagSlug: string;
  confidence: number;
  evidence: string;
}> {
  const groups = new Map<string, { maxConfidence: number; evidenceParts: string[] }>();
  for (const t of tags) {
    const existing = groups.get(t.tag);
    if (existing === undefined) {
      groups.set(t.tag, { maxConfidence: t.confidence, evidenceParts: [t.evidence] });
    } else {
      existing.maxConfidence = Math.max(existing.maxConfidence, t.confidence);
      existing.evidenceParts.push(t.evidence);
    }
  }
  return [...groups.entries()].map(([tagSlug, g]) => ({
    tagSlug,
    confidence: g.maxConfidence,
    evidence: g.evidenceParts.join('\n\n'),
  }));
}

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

  const cardsResult = await findUntaggedCards(BATCH_SIZE, TAG_SOURCE);
  if (!cardsResult.ok) {
    console.error(`Failed to find untagged cards [${cardsResult.error.kind}]:`, cardsResult.error);
    process.exit(1);
  }

  const cards = cardsResult.value;

  if (cards.length === 0) {
    const statsResult = await getTaggingQueueStats(TAG_SOURCE);
    if (!statsResult.ok) {
      console.error(`Failed to load tagging queue stats [${statsResult.error.kind}]:`, statsResult.error);
      return;
    }
    const s = statsResult.value;
    console.log(`Tagging queue is empty for source "${TAG_SOURCE}".`);
    console.log(
      `  Total cards: ${s.totalCards}; with oracle text: ${s.cardsWithOracleText}; pending (oracle + taggable types, not basic land): ${s.pendingForTagSource}.`,
    );
    if (s.totalCards === 0) {
      console.log('  No cards in the database. Import or sync cards first.');
    } else if (s.cardsWithOracleText === 0) {
      console.log(
        '  No cards have top-level oracle text (empty string is excluded). Check card sync / data.',
      );
    } else {
      console.log(
        '  Every eligible card (artifact, creature, enchantment, instant, planeswalker, sorcery, etc.—not basic lands or typeless) already has tags or a completion for this source. Bump TAG_SOURCE or clear rows to re-run.',
      );
    }
    return;
  }

  console.log(`Found ${cards.length} cards pending tagging (source: ${TAG_SOURCE})\n`);

  for (const card of cards) {
    if (!isCardEligibleForLlmTagging(card)) {
      console.log(`${'='.repeat(60)}`);
      console.log(`  SKIP (not taggable): ${card.name}`);
      console.log(`  ${card.typeLine}`);
      console.log(`${'='.repeat(60)}`);
      const skipSave = await upsertCardTags(card.id, TAG_SOURCE, []);
      if (!skipSave.ok) {
        console.error(`  SAVE ERROR [${skipSave.error.kind}]:`, skipSave.error);
      } else {
        console.log(`  marked complete with no tags (${skipSave.value.inserted} inserted, ${skipSave.value.deleted} deleted)`);
      }
      continue;
    }

    console.log(`${'='.repeat(60)}`);
    console.log(`  ${card.name} ${card.manaCost ?? ''}`);
    console.log(`  ${card.typeLine}`);
    if (card.oracleText) {
      console.log(`  "${card.oracleText}"`);
    }
    console.log(`${'='.repeat(60)}`);

    if (card.supertypes.includes('Basic') && card.types.includes('Land')) {
      console.log(`  SKIP (basic land): ${card.name}`);
      console.log(`  ${card.typeLine}`);
      console.log(`${'='.repeat(60)}`);
      const skipSave = await upsertCardTags(card.id, TAG_SOURCE, []);
      if (!skipSave.ok) {
        console.error(`  SAVE ERROR [${skipSave.error.kind}]:`, skipSave.error);
      }
    }

    if (card.typeLine.includes('Token Creature')) {
      console.log(`  SKIP (token creature): ${card.name}`);
      console.log(`  ${card.typeLine}`);
      console.log(`${'='.repeat(60)}`);
      const skipSave = await upsertCardTags(card.id, TAG_SOURCE, []);
      if (!skipSave.ok) {
        console.error(`  SAVE ERROR [${skipSave.error.kind}]:`, skipSave.error);
      }
    }

    const result = await tagger.tagCard(card);

    if (!result.ok) {
      console.error(`  ERROR [${result.error.kind}]:`, result.error);
      continue;
    }

    const { tags, skippedTags, usage } = result.value;

    if (skippedTags.length > 0) {
      for (const s of skippedTags) {
        const why =
          s.reason === 'below_confidence_threshold' ? 'below confidence cutoff' : 'exceeded max tags';
        console.log(`  (skipped) ${s.tag.padEnd(22)} ${s.confidence.toFixed(2)}  ${why}  "${s.evidence}"`);
      }
    }

    if (tags.length === 0) {
      console.log('  (no tags assigned)');
    } else {
      for (const t of tags) {
        console.log(`  ${t.tag.padEnd(25)} ${t.confidence.toFixed(2)}  "${t.evidence}"`);
      }
    }

    console.log(`  tokens: ${usage.promptTokens} in / ${usage.completionTokens} out / ${usage.totalTokens} total`);

    const tagsForSave = collapseDuplicateTags(tags);
    if (tagsForSave.length < tags.length) {
      console.log(`  merged ${tags.length} tag row(s) → ${tagsForSave.length} unique slug(s) for save`);
    }

    const saveResult = await upsertCardTags(card.id, TAG_SOURCE, tagsForSave);

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
