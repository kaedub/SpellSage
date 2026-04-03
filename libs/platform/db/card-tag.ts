import { ok, err } from '@shared/result';
import type { Result } from '@shared/result';

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

export async function upsertCardTags(
  cardId: string,
  source: string,
  tags: readonly string[],
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
        data: tags.map(tagSlug => ({ cardId, tagSlug, source })),
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
