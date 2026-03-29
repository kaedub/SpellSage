import { PrismaClient, Card, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Insert or upsert multiple cards
export async function insertCards(cards: Omit<Card, 'createdAt' | 'updatedAt'>[]) {
  const results = await prisma.$transaction(
    cards.map(card => {
      // Ensure faces and rawJson are always valid Prisma JSON values
      const safeCard = {
        ...card,
        faces: card.faces === null || card.faces === undefined ? Prisma.JsonNull : card.faces,
        rawJson: card.rawJson === null || card.rawJson === undefined ? Prisma.JsonNull : card.rawJson,
      };
      return prisma.card.upsert({
        where: { id: card.id },
        update: safeCard,
        create: safeCard,
      });
    })
  );
  return results;
}

// Get all collection records (dump entire collection)
export async function getCollection() {
  return prisma.collection.findMany();
}

// Bulk add cards to a user's collection (upsert by card name and set)
export async function addToCollection(params: Array<{
  userId: string;
  cardName: string;
  set: string;
  quantity: number;
}>) {
  // Lookup all card IDs first
  const cardLookups = await Promise.all(
    params.map(({ cardName, set }) =>
      prisma.card.findFirst({
        where: { name: cardName, set },
        select: { id: true },
      })
    )
  );

  // Build upsert operations
  const ops = params.map(({ userId, quantity }, i) => {
    const card = cardLookups[i];
    if (!card) throw new Error(`Card not found for params[${i}]`);
    return prisma.collection.upsert({
      where: {
        userId_cardId: { userId, cardId: card.id },
      },
      update: { quantity },
      create: { userId, cardId: card.id, quantity },
    });
  });

  return prisma.$transaction(ops);
}

// Remove a collection row by primary key, scoped to the owning user
export async function removeFromCollection(params: {
  id: number;
  userId: string;
}) {
  const { id, userId } = params;
  return prisma.collection.delete({
    where: {
      id,
      userId,
    },
  });
}
