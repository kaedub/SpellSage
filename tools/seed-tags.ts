import 'dotenv/config';

import { prisma } from '../libs/platform/adapters/prisma/client';
import { CardSchema } from '@shared/schemas';
import type { Card } from '@shared/types';
import { upsertCardTags, loadTagTaxonomy } from '@platform/db';
import { structuredCompletion, createCardTaggingService } from '@ai';

const MAX_CARDS = 5;

function prismaCardToCard(row: Record<string, unknown>): Card {
  const { createdAt: _, updatedAt: __, collections: ___, tags: ____, ...rest } = row;

  return CardSchema.parse({
    ...rest,
    manaCost: rest.manaCost ?? undefined,
    cmc: rest.cmc ?? undefined,
    oracleText: rest.oracleText ?? undefined,
    faces: rest.faces ?? null,
    rawJson: rest.rawJson ?? {},
  });
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

  const randomCardIds = await prisma.$queryRaw<{ card_id: string }[]>`
    SELECT card_id FROM (
      SELECT DISTINCT c.card_id
      FROM "Collection" c
      JOIN "Card" k ON k.id = c.card_id
      WHERE k.oracle_text IS NOT NULL AND k.oracle_text <> ''
        AND NOT EXISTS (
          SELECT 1 FROM "CardTag" ct
          WHERE ct.card_id = c.card_id AND ct.source = 'ai'
        )
    ) AS pool
    ORDER BY RANDOM()
    LIMIT ${MAX_CARDS}
  `;

  if (randomCardIds.length === 0) {
    console.error('No cards with oracle text found in collection. Seed some cards first.');
    process.exit(1);
  }

  const cards = await prisma.card.findMany({
    where: { id: { in: randomCardIds.map(r => r.card_id) } },
  });

  const sample = cards.slice(0, MAX_CARDS);

  for (const row of sample) {
    const card = prismaCardToCard(row as unknown as Record<string, unknown>);

    console.log(`\n${'='.repeat(60)}`);
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

    const saveResult = await upsertCardTags(card.id, 'ai', tags.map(t => t.tag));

    if (!saveResult.ok) {
      console.error(`  SAVE ERROR [${saveResult.error.kind}]:`, saveResult.error);
    } else {
      const { inserted, deleted } = saveResult.value;
      console.log(`  saved: ${inserted} inserted, ${deleted} previous deleted`);
    }
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
