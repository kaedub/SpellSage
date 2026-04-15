import type { Collection, CollectionCard } from '@prisma/client';

import type { CardSummary } from '@shared/search';
import { ok, err } from '@shared/result';
import type { Result } from '@shared/result';
import { collectionCardKey } from '@shared/collection-text';

import { prisma } from '../adapters/prisma/client';
import { CARD_SUMMARY_SELECT, toCardSummary } from './search';

// --- Error types ---

export type CollectionError =
  | { kind: 'not_found'; message: string }
  | { kind: 'duplicate'; message: string }
  | { kind: 'card_not_found'; message: string }
  | { kind: 'database_error'; message: string };

// --- Collection CRUD ---

export async function createCollection(params: {
  userId: string;
  name: string;
}): Promise<Result<Collection, CollectionError>> {
  try {
    const collection = await prisma.collection.create({
      data: { userId: params.userId, name: params.name },
    });
    return ok(collection);
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return err({
        kind: 'duplicate',
        message: `Collection "${params.name}" already exists for this user`,
      });
    }
    return err({ kind: 'database_error', message: errorMessage(error) });
  }
}

export async function getCollectionsByUser(
  userId: string,
): Promise<Result<CollectionSummary[], CollectionError>> {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId },
      include: { _count: { select: { cards: true } } },
      orderBy: { name: 'asc' },
    });

    return ok(
      collections.map((c) => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        cardCount: c._count.cards,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    );
  } catch (error) {
    return err({ kind: 'database_error', message: errorMessage(error) });
  }
}

export interface CollectionSummary {
  id: number;
  userId: string;
  name: string;
  cardCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCollectionCards(
  collectionId: number,
): Promise<Result<CollectionCardEntry[], CollectionError>> {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    });
    if (!collection) {
      return err({ kind: 'not_found', message: `Collection ${collectionId} not found` });
    }

    const rows = await prisma.collectionCard.findMany({
      where: { collectionId },
      include: { card: { select: CARD_SUMMARY_SELECT } },
      orderBy: { card: { name: 'asc' } },
    });

    return ok(
      rows.map((row) => ({
        collectionCardId: row.id,
        collectionId: row.collectionId,
        cardId: row.cardId,
        quantity: row.quantity,
        foil: row.foil,
        card: toCardSummary(row.card),
      })),
    );
  } catch (error) {
    return err({ kind: 'database_error', message: errorMessage(error) });
  }
}

export type CollectionCardWithSummary = {
  readonly cardId: string;
  readonly quantity: number;
  readonly foil: boolean;
  readonly card: CardSummary;
};

/**
 * Collection rows whose card has at least one of the given tag slugs (OR).
 * One row per (collectionId, cardId, foil); merge in the service layer if needed.
 */
export async function getCollectionCardsByTags(
  collectionId: number,
  tagSlugs: readonly string[],
): Promise<Result<CollectionCardWithSummary[], CollectionError>> {
  if (tagSlugs.length === 0) {
    return ok([]);
  }

  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    });
    if (!collection) {
      return err({ kind: 'not_found', message: `Collection ${collectionId} not found` });
    }

    const rows = await prisma.collectionCard.findMany({
      where: {
        collectionId,
        card: {
          tags: {
            some: { tagSlug: { in: [...tagSlugs] } },
          },
        },
      },
      include: { card: { select: CARD_SUMMARY_SELECT } },
      orderBy: { card: { name: 'asc' } },
    });

    return ok(
      rows.map((row) => ({
        cardId: row.cardId,
        quantity: row.quantity,
        foil: row.foil,
        card: toCardSummary(row.card),
      })),
    );
  } catch (error) {
    return err({ kind: 'database_error', message: errorMessage(error) });
  }
}

/**
 * Collection rows whose Oracle type line indicates a land (e.g. "Basic Land — Forest", "Land Creature").
 * Used to merge mana sources into archetype-tagged candidate pools.
 */
export async function getCollectionLandCards(
  collectionId: number,
): Promise<Result<CollectionCardWithSummary[], CollectionError>> {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    });
    if (!collection) {
      return err({ kind: 'not_found', message: `Collection ${collectionId} not found` });
    }

    const rows = await prisma.collectionCard.findMany({
      where: {
        collectionId,
        card: {
          typeLine: { contains: 'Land', mode: 'insensitive' },
        },
      },
      include: { card: { select: CARD_SUMMARY_SELECT } },
      orderBy: { card: { name: 'asc' } },
    });

    return ok(
      rows.map((row) => ({
        cardId: row.cardId,
        quantity: row.quantity,
        foil: row.foil,
        card: toCardSummary(row.card),
      })),
    );
  } catch (error) {
    return err({ kind: 'database_error', message: errorMessage(error) });
  }
}

export interface CollectionCardEntry {
  collectionCardId: number;
  collectionId: number;
  cardId: string;
  quantity: number;
  foil: boolean;
  card: Record<string, unknown>;
}

export async function addCardsToCollection(
  collectionId: number,
  entries: Array<{ cardId: string; quantity: number; foil?: boolean }>,
): Promise<Result<CollectionCard[], CollectionError>> {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    });
    if (!collection) {
      return err({ kind: 'not_found', message: `Collection ${collectionId} not found` });
    }

    const ops = entries.map(({ cardId, quantity, foil }) => {
      const isFoil = foil ?? false;
      return prisma.collectionCard.upsert({
        where: {
          collectionId_cardId_foil: { collectionId, cardId, foil: isFoil },
        },
        update: { quantity },
        create: { collectionId, cardId, quantity, foil: isFoil },
      });
    });

    const results = await prisma.$transaction(ops);
    return ok(results);
  } catch (error) {
    return err({ kind: 'database_error', message: errorMessage(error) });
  }
}

export async function removeCardFromCollection(
  collectionCardId: number,
): Promise<Result<CollectionCard, CollectionError>> {
  try {
    const existing = await prisma.collectionCard.findUnique({
      where: { id: collectionCardId },
    });
    if (!existing) {
      return err({
        kind: 'not_found',
        message: `CollectionCard ${collectionCardId} not found`,
      });
    }

    const deleted = await prisma.collectionCard.delete({
      where: { id: collectionCardId },
    });
    return ok(deleted);
  } catch (error) {
    return err({ kind: 'database_error', message: errorMessage(error) });
  }
}

export async function deleteCollection(
  collectionId: number,
): Promise<Result<Collection, CollectionError>> {
  try {
    const existing = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    });
    if (!existing) {
      return err({ kind: 'not_found', message: `Collection ${collectionId} not found` });
    }

    const deleted = await prisma.collection.delete({
      where: { id: collectionId },
    });
    return ok(deleted);
  } catch (error) {
    return err({ kind: 'database_error', message: errorMessage(error) });
  }
}

// --- Card lookup (unchanged, not collection-specific) ---

export async function findCardsByCollectorInfo(
  entries: Array<{ name: string; set: string; collectorNum: string }>,
): Promise<Map<string, string>> {
  if (entries.length === 0) return new Map();

  const conditions = entries.map(({ name, set, collectorNum }) => ({
    name,
    set,
    collectorNum,
  }));

  const cards = await prisma.card.findMany({
    where: { OR: conditions },
    select: { id: true, name: true, set: true, collectorNum: true },
  });

  const result = new Map<string, string>();
  for (const card of cards) {
    const key = collectionCardKey(card.name, card.set, card.collectorNum);
    result.set(key, card.id);
  }

  return result;
}

// --- Batch upsert for seed tooling ---

export async function upsertCollectionEntries(
  collectionId: number,
  entries: Array<{ cardId: string; quantity: number; foil: boolean }>,
): Promise<number> {
  if (entries.length === 0) return 0;

  const ops = entries.map(({ cardId, quantity, foil }) =>
    prisma.collectionCard.upsert({
      where: {
        collectionId_cardId_foil: { collectionId, cardId, foil },
      },
      update: { quantity },
      create: { collectionId, cardId, quantity, foil },
    }),
  );

  const results = await prisma.$transaction(ops);
  return results.length;
}

// --- Helpers ---

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown database error';
}
