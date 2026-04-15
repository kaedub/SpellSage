import type { Prisma } from '@prisma/client';

import { ok, err } from '@shared/result';
import type { Result } from '@shared/result';
import { CardPrintingSchema } from '@shared/schemas';
import type { CardPrinting } from '@shared/types';

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

function whereCardWithOracleText(): Prisma.CardPrintingWhereInput {
  return {
    AND: [{ oracleText: { not: null } }, { oracleText: { not: '' } }],
  };
}

/** Non-empty type line (DB cannot trim; whitespace-only lines filtered in `isCardEligibleForLlmTagging`). */
function whereCardHasTypeLine(): Prisma.CardPrintingWhereInput {
  return { typeLine: { not: '' } };
}

/** Excludes Basic Lands (including snow); non-basic lands are excluded when they have no taggable card type. */
function whereNotBasicLand(): Prisma.CardPrintingWhereInput {
  return {
    NOT: {
      AND: [{ supertypes: { has: 'Basic' } }, { types: { has: 'Land' } }],
    },
  };
}

function whereHasTaggableCardType(): Prisma.CardPrintingWhereInput {
  return { types: { hasSome: [...TAGGABLE_CARD_TYPES] } };
}

function whereEligibleForLlmTagging(): Prisma.CardPrintingWhereInput {
  return {
    AND: [whereCardHasTypeLine(), whereNotBasicLand(), whereHasTaggableCardType()],
  };
}

export function isCardEligibleForLlmTagging(
  card: Pick<CardPrinting, 'typeLine' | 'supertypes' | 'types'>,
): boolean {
  if (card.typeLine.trim() === '') {
    return false;
  }
  if (card.supertypes.includes('Basic') && card.types.includes('Land')) {
    return false;
  }
  return TAGGABLE_CARD_TYPES.some(t => card.types.includes(t));
}

function wherePendingTaggingForSource(tagSource: string): Prisma.CardPrintingWhereInput {
  return {
    AND: [whereCardWithOracleText(), whereEligibleForLlmTagging()],
    oracleCard: {
      is: {
        tags: { none: { source: tagSource } },
        taggingCompletions: { none: { source: tagSource } },
      },
    },
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
    const card = await prisma.cardPrinting.findUnique({
      where: { id: cardId },
      select: { id: true, oracleId: true },
    });
    if (card === null) {
      return err({ kind: 'card_not_found' as const, cardId });
    }

    const result = await prisma.$transaction(async (tx) => {
      const { count: deleted } = await tx.oracleCardTag.deleteMany({
        where: { oracleId: card.oracleId, source },
      });

      if (tags.length === 0) {
        await tx.oracleCardTaggingCompletion.upsert({
          where: { oracleId_source: { oracleId: card.oracleId, source } },
          create: { oracleId: card.oracleId, source },
          update: { completedAt: new Date() },
        });
        return { deleted, inserted: 0 };
      }

      await tx.oracleCardTaggingCompletion.deleteMany({
        where: { oracleId: card.oracleId, source },
      });

      const { count: inserted } = await tx.oracleCardTag.createMany({
        data: tags.map(t => ({
          oracleId: card.oracleId,
          tagSlug: t.tagSlug,
          source,
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
      prisma.cardPrinting.count(),
      prisma.cardPrinting.count({ where: whereCardWithOracleText() }),
      prisma.cardPrinting.count({ where: wherePendingTaggingForSource(tagSource) }),
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
): Promise<Result<CardPrinting[], CardTagError>> {
  try {
    const rows = await prisma.cardPrinting.findMany({
      where: wherePendingTaggingForSource(tagSource),
      take: limit,
    });

    const cards = rows.map((row): CardPrinting =>
      CardPrintingSchema.parse({
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
