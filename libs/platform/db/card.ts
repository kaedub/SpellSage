import { Prisma } from '@prisma/client';

import type { CardPrinting } from '@shared/types';

import { prisma } from '../adapters/prisma/client';

function toPrismaData(card: CardPrinting) {
  return {
    id: card.id,
    oracleId: card.oracleId,
    name: card.name,
    set: card.set,
    setId: card.setId,
    collectorNum: card.collectorNum,
    typeLine: card.typeLine,
    supertypes: card.supertypes,
    types: card.types,
    subtypes: card.subtypes,
    isLegendary: card.isLegendary,
    colors: card.colors ?? [],
    colorIdentity: card.colorIdentity ?? [],
    manaCost: card.manaCost ?? null,
    cmc: card.cmc ?? null,
    oracleText: card.oracleText ?? null,
    layout: card.layout,
    faces: card.faces === null || card.faces === undefined ? Prisma.JsonNull : card.faces,
    power: card.power,
    toughness: card.toughness,
    rarity: card.rarity ?? null,
    price: card.price ?? null,
    numericPower: card.numericPower ?? null,
    numericToughness: card.numericToughness ?? null,
    keywords: card.keywords,
    keywordsCi: card.keywords.map((k) => k.toLowerCase()),
    producedMana: card.producedMana,
    gameChanger: card.gameChanger,
    scryfallUri: card.scryfallUri,
    imageUri: card.imageUri,
    // SAFE: rawJson is always a JSON-serializable object produced by Scryfall API responses
    rawJson: card.rawJson as Prisma.InputJsonValue,
  };
}

export async function insertCards(cards: CardPrinting[]): Promise<void> {
  for (const card of cards) {
    const data = toPrismaData(card);

    await prisma.cardPrinting.upsert({
      where: { id: card.id },
      update: data,
      create: data,
      select: { id: true },
    });
  }
}
