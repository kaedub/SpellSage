import { ok, err } from '@shared/result';
import type { Result } from '@shared/result';
import { CardSchema } from '@shared/schemas';
import type { Card } from '@shared/types';

import { prisma } from '../adapters/prisma/client';

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
        return { deleted, inserted: 0 };
      }

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

export async function findUntaggedCollectionCards(
  limit: number,
): Promise<Result<Card[], CardTagError>> {
  try {
    const rows = await prisma.card.findMany({
      where: {
        collectionCards: { some: {} },
        tags: { none: {} },
        AND: [
          { oracleText: { not: null } },
          { oracleText: { not: '' } },
        ],
      },
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
