import { Prisma } from '@prisma/client';

import type { OracleCard } from '@shared/types';

import { prisma } from '../adapters/prisma/client';

function toPrismaData(oracle: OracleCard) {
    return {
        id: oracle.id,
        oracleId: oracle.oracleId,
        name: oracle.name,
        set: oracle.set,
        setId: oracle.setId,
        collectorNum: oracle.collectorNum,
        typeLine: oracle.typeLine,
        supertypes: oracle.supertypes,
        types: oracle.types,
        subtypes: oracle.subtypes,
        isLegendary: oracle.isLegendary,
        colors: oracle.colors ?? [],
        colorIdentity: oracle.colorIdentity ?? [],
        manaCost: oracle.manaCost ?? null,
        cmc: oracle.cmc ?? null,
        oracleText: oracle.oracleText ?? null,
        layout: oracle.layout,
        faces:
            oracle.faces === null || oracle.faces === undefined
                ? Prisma.JsonNull
                : oracle.faces,
        power: oracle.power,
        toughness: oracle.toughness,
        numericPower: oracle.numericPower ?? null,
        numericToughness: oracle.numericToughness ?? null,
        keywords: oracle.keywords,
        keywordsCi: oracle.keywords.map(k => k.toLowerCase()),
        producedMana: oracle.producedMana,
        gameChanger: oracle.gameChanger,
        scryfallUri: oracle.scryfallUri,
        imageUri: oracle.imageUri,
        rarity: oracle.rarity ?? null,
        price: oracle.price ?? null,
    };
}

export async function insertOracleCards(cards: OracleCard[]): Promise<void> {
    for (const card of cards) {
        const data = toPrismaData(card);

        await prisma.oracleCard.upsert({
            where: { oracleId: card.oracleId },
            update: data,
            create: data,
            select: { id: true },
        });
    }
}
