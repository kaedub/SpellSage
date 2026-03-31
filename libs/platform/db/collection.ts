import type { Collection } from '@prisma/client';

import { collectionCardKey } from '@shared/collection-text';

import { prisma } from '../adapters/prisma/client';

export async function getCollection(): Promise<Collection[]> {
  return prisma.collection.findMany();
}

export async function addToCollection(params: Array<{
  userId: string;
  cardName: string;
  set: string;
  quantity: number;
  foil?: boolean;
}>): Promise<Collection[]> {
  const cardLookups = await Promise.all(
    params.map(({ cardName, set }) =>
      prisma.card.findFirst({
        where: { name: cardName, set },
        select: { id: true },
      }),
    ),
  );

  const ops = params.map(({ userId, quantity, foil }, i) => {
    const card = cardLookups[i];
    if (!card) throw new Error(`Card not found for params[${i}]`);
    const isFoil = foil ?? false;
    return prisma.collection.upsert({
      where: {
        userId_cardId_foil: { userId, cardId: card.id, foil: isFoil },
      },
      update: { quantity },
      create: { userId, cardId: card.id, quantity, foil: isFoil },
    });
  });

  return prisma.$transaction(ops);
}

export async function removeFromCollection(params: {
  id: number;
  userId: string;
}): Promise<Collection> {
  const { id, userId } = params;

  const existing = await prisma.collection.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error(`Collection row not found for id=${id}, userId=${userId}`);
  }

  return prisma.collection.delete({
    where: { id },
  });
}

/**
 * Batch-resolve cards by name + set + collectorNum.
 * Returns a map of `collectionCardKey` -> Scryfall card ID.
 */
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

export async function upsertCollectionEntries(
  entries: Array<{
    userId: string;
    cardId: string;
    quantity: number;
    foil: boolean;
  }>,
): Promise<number> {
  if (entries.length === 0) return 0;

  const ops = entries.map(({ userId, cardId, quantity, foil }) =>
    prisma.collection.upsert({
      where: {
        userId_cardId_foil: { userId, cardId, foil },
      },
      update: { quantity },
      create: { userId, cardId, quantity, foil },
    }),
  );

  const results = await prisma.$transaction(ops);
  return results.length;
}

