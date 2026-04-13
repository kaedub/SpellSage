import type { Prisma } from '@prisma/client';

import { ok, err } from '@shared/result';
import type { Result } from '@shared/result';
import { CardSchema } from '@shared/schemas';
import type { Card } from '@shared/types';

import { prisma } from '../adapters/prisma/client';

/**
 * Card types we run through the tagging LLM (deck-relevant permanents and spells).
 * Lands, basic lands, tokens-only layouts without these types, etc. stay out of the queue.
 */
export const TAGGABLE_CARD_TYPES = [
  'Artifact',
  'Battle',
  'Creature',
  'Enchantment',
  'Instant',
  'Kindred',
  'Planeswalker',
  'Sorcery',
  'Tribal',
] as const;

function whereCardWithOracleText(): Prisma.CardWhereInput {
  return {
    AND: [{ oracleText: { not: null } }, { oracleText: { not: '' } }],
  };
}

/** Non-empty type line (DB cannot trim; whitespace-only lines filtered in `isCardEligibleForLlmTagging`). */
function whereCardHasTypeLine(): Prisma.CardWhereInput {
  return { typeLine: { not: '' } };
}

/** Excludes Basic Lands (including snow); non-basic lands are excluded when they have no taggable card type. */
function whereNotBasicLand(): Prisma.CardWhereInput {
  return {
    NOT: {
      AND: [{ supertypes: { has: 'Basic' } }, { types: { has: 'Land' } }],
    },
  };
}

function whereHasTaggableCardType(): Prisma.CardWhereInput {
  return { types: { hasSome: [...TAGGABLE_CARD_TYPES] } };
}

function whereEligibleForLlmTagging(): Prisma.CardWhereInput {
  return {
    AND: [whereCardHasTypeLine(), whereNotBasicLand(), whereHasTaggableCardType()],
  };
}

export function isCardEligibleForLlmTagging(
  card: Pick<Card, 'typeLine' | 'supertypes' | 'types'>,
): boolean {
  if (card.typeLine.trim() === '') {
    return false;
  }
  if (card.supertypes.includes('Basic') && card.types.includes('Land')) {
    return false;
  }
  return TAGGABLE_CARD_TYPES.some(t => card.types.includes(t));
}

function wherePendingTaggingForSource(tagSource: string): Prisma.CardWhereInput {
  return {
    AND: [whereCardWithOracleText(), whereEligibleForLlmTagging()],
    tags: { none: { source: tagSource } },
    taggingCompletions: { none: { source: tagSource } },
  };
}

export type CardTagError =
  | { kind: 'card_not_found'; cardId: string }
  | { kind: 'database_error'; message: string };

export type UpsertCardTagsResult = {
  readonly cardId: string;
  readonly source: string;
  readonly inserted: number;
  readonly deleted: number;
};

export type CardTagInput = {
  readonly tagSlug: string;
  readonly confidence: number;
  readonly evidence: string;
};

export async function upsertCardTags(
  cardId: string,
  source: string,
  tags: readonly CardTagInput[],
): Promise<Result<UpsertCardTagsResult, CardTagError>> {
  try {
    const card = await prisma.card.findUnique({ where: { id: cardId }, select: { id: true } });
    if (card === null) {
      return err({ kind: 'card_not_found' as const, cardId });
    }

    const result = await prisma.$transaction(async (tx) => {
      const { count: deleted } = await tx.cardTag.deleteMany({
        where: { cardId, source },
      });

      if (tags.length === 0) {
        await tx.cardTaggingCompletion.upsert({
          where: { cardId_source: { cardId, source } },
          create: { cardId, source },
          update: { completedAt: new Date() },
        });
        return { deleted, inserted: 0 };
      }

      await tx.cardTaggingCompletion.deleteMany({
        where: { cardId, source },
      });

      const { count: inserted } = await tx.cardTag.createMany({
        data: tags.map(t => ({
          cardId,
          tagSlug: t.tagSlug,
          source,
          confidence: t.confidence,
          evidence: t.evidence,
        })),
      });

      return { deleted, inserted };
    });

    return ok({
      cardId,
      source,
      inserted: result.inserted,
      deleted: result.deleted,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error' as const, message });
  }
}

export type TaggingQueueStats = {
  /** All rows in `Card`. */
  readonly totalCards: number;
  /** Cards with non-null, non-empty top-level `oracleText`. */
  readonly cardsWithOracleText: number;
  /** Eligible for tagging for `tagSource` (oracle + type line + taggable types + not basic land + not tagged + no completion row). */
  readonly pendingForTagSource: number;
};

/**
 * Explains an empty tagging queue: eligible cards have oracle text on the row;
 * this source's work is done when each has tags or a `CardTaggingCompletion` row.
 */
export async function getTaggingQueueStats(
  tagSource: string,
): Promise<Result<TaggingQueueStats, CardTagError>> {
  try {
    const [totalCards, cardsWithOracleText, pendingForTagSource] = await Promise.all([
      prisma.card.count(),
      prisma.card.count({ where: whereCardWithOracleText() }),
      prisma.card.count({ where: wherePendingTaggingForSource(tagSource) }),
    ]);

    return ok({
      totalCards,
      cardsWithOracleText,
      pendingForTagSource,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error' as const, message });
  }
}

export async function findUntaggedCards(
  limit: number,
  tagSource: string,
): Promise<Result<Card[], CardTagError>> {
  try {
    const rows = await prisma.card.findMany({
      where: wherePendingTaggingForSource(tagSource),
      take: limit,
    });

    const cards = rows.map((row): Card =>
      CardSchema.parse({
        ...row,
        manaCost: row.manaCost ?? undefined,
        cmc: row.cmc ?? undefined,
        oracleText: row.oracleText ?? undefined,
        // SAFE: rawJson is stored as a JSON-serializable Scryfall API response
        rawJson: row.rawJson as Record<string, unknown>,
      }),
    );

    return ok(cards);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error' as const, message });
  }
}
