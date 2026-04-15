import { z } from 'zod';

export const Color = {
    White: 'W',
    Blue: 'U',
    Black: 'B',
    Red: 'R',
    Green: 'G',
    Colorless: 'C',
} as const;

export const ColorSchema = z.enum(Color);

export const CardFaceSchema = z.object({
    name: z.string(),
    typeLine: z.string(),
    manaCost: z.string().optional(),
    oracleText: z.string().optional(),
    colors: z.array(ColorSchema).optional(),
    power: z.string().optional(),
    toughness: z.string().optional(),
    imageUri: z.string().optional(),
});

export const CardSchema = z.object({
    // id is the Scryfall card id
    id: z.string(),
    // oracleId is the Scryfall oracle id (unique)
    oracleId: z.string(),
    name: z.string(),
    set: z.string(),
    setId: z.string(),
    collectorNum: z.string(),
    typeLine: z.string(),
    supertypes: z.array(z.string()),
    types: z.array(z.string()),
    subtypes: z.array(z.string()),
    isLegendary: z.boolean(),
    rarity: z.string(),
    price: z.string(),
    colors: z.array(ColorSchema).optional(),
    colorIdentity: z.array(ColorSchema).optional(),
    manaCost: z.string().optional(),
    cmc: z.number().optional(),
    oracleText: z.string().optional(),
    layout: z.string(),
    faces: z.array(CardFaceSchema).nullable(),
    power: z.string().nullable(),
    toughness: z.string().nullable(),
    numericPower: z.number().int().nullable(),
    numericToughness: z.number().int().nullable(),
    keywords: z.array(z.string()),
    producedMana: z.array(ColorSchema),
    gameChanger: z.boolean(),
    scryfallUri: z.string().url(),
    imageUri: z.string(),
    rawJson: z.record(z.string(), z.unknown()),
});

export const OracleCardSchema = CardSchema.omit({
    rawJson: true,
});
