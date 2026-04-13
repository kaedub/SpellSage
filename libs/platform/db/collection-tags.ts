import { Prisma } from '@prisma/client';

import { ok, err } from '@shared/result';
import type { Result } from '@shared/result';

import { prisma } from '../adapters/prisma/client';

import type { CollectionError } from './collection';

export type CollectionTagAggregate = {
  readonly tagSlug: string;
  readonly distinctCards: number;
  readonly totalQuantity: number;
};

function toNumber(value: bigint | number): number {
  return typeof value === 'bigint' ? Number(value) : value;
}

/**
 * Per-tagSlug signals for cards in a collection: distinct cardIds and summed quantities
 * across all collection rows (foil/non-foil) for those cardIds.
 */
export async function getCollectionTagAggregates(
  collectionId: number,
): Promise<Result<readonly CollectionTagAggregate[], CollectionError>> {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    });
    if (collection === null) {
      return err({ kind: 'not_found', message: `Collection ${collectionId} not found` });
    }

    const rows = await prisma.$queryRaw<
      Array<{ tag_slug: string; distinct_cards: bigint | number; total_quantity: bigint | number }>
    >(Prisma.sql`
      SELECT
        ct."tag_slug" AS tag_slug,
        COUNT(DISTINCT cc."card_id")::bigint AS distinct_cards,
        COALESCE(SUM(cc."quantity"), 0)::bigint AS total_quantity
      FROM "CollectionCard" cc
      INNER JOIN "CardTag" ct
        ON ct."card_id" = cc."card_id"
      WHERE cc."collection_id" = ${collectionId}
      GROUP BY ct."tag_slug"
      ORDER BY distinct_cards DESC, ct."tag_slug" ASC
    `);

    return ok(
      rows.map((r) => ({
        tagSlug: r.tag_slug,
        distinctCards: toNumber(r.distinct_cards),
        totalQuantity: toNumber(r.total_quantity),
      })),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error', message });
  }
}

export type CollectionCardInventoryStats = {
  readonly collectionCardRows: number;
  readonly distinctCards: number;
  readonly totalQuantity: number;
};

/**
 * Row counts and quantity totals for a collection (no tag join).
 */
export async function getCollectionCardInventoryStats(
  collectionId: number,
): Promise<Result<CollectionCardInventoryStats, CollectionError>> {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    });
    if (collection === null) {
      return err({ kind: 'not_found', message: `Collection ${collectionId} not found` });
    }

    const rows = await prisma.$queryRaw<
      Array<{
        collection_card_rows: bigint | number;
        distinct_cards: bigint | number;
        total_quantity: bigint | number;
      }>
    >(Prisma.sql`
      SELECT
        COUNT(*)::bigint AS collection_card_rows,
        COUNT(DISTINCT "card_id")::bigint AS distinct_cards,
        COALESCE(SUM("quantity"), 0)::bigint AS total_quantity
      FROM "CollectionCard"
      WHERE "collection_id" = ${collectionId}
    `);

    const row = rows[0];
    if (row === undefined) {
      return ok({
        collectionCardRows: 0,
        distinctCards: 0,
        totalQuantity: 0,
      });
    }

    return ok({
      collectionCardRows: toNumber(row.collection_card_rows),
      distinctCards: toNumber(row.distinct_cards),
      totalQuantity: toNumber(row.total_quantity),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error', message });
  }
}

/**
 * Distinct cardIds in the collection that have at least one CardTag for the given source.
 */
export async function getCollectionDistinctTaggedCardCount(
  collectionId: number,
): Promise<Result<number, CollectionError>> {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    });
    if (collection === null) {
      return err({ kind: 'not_found', message: `Collection ${collectionId} not found` });
    }

    const rows = await prisma.$queryRaw<Array<{ c: bigint | number }>>(Prisma.sql`
      SELECT COUNT(DISTINCT cc."card_id")::bigint AS c
      FROM "CollectionCard" cc
      INNER JOIN "CardTag" ct
        ON ct."card_id" = cc."card_id"
      WHERE cc."collection_id" = ${collectionId}
    `);

    const row = rows[0];
    if (row === undefined) {
      return ok(0);
    }
    return ok(toNumber(row.c));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error', message });
  }
}
