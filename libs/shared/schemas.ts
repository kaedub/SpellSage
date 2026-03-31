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

export const SupertypeSchema = z.enum([
    'Legendary',
    'Basic',
    'Snow',
    'World',
    'Ongoing',
]);

export const CardTypeSchema = z.enum([
    'Artifact',
    'Battle',
    'Conspiracy',
    'Creature',
    'Dungeon',
    'Enchantment',
    'Host',
    'Instant',
    'Kindred',
    'Land',
    'Phenomenon',
    'Plane',
    'Planeswalker',
    'Scheme',
    'Sorcery',
    'Tribal',
    'Vanguard',
]);

export const LayoutSchema = z.enum([
    'normal',
    'split',
    'flip',
    'transform',
    'modal_dfc',
    'meld',
    'leveler',
    'class',
    'case',
    'saga',
    'adventure',
    'mutate',
    'prototype',
    'battle',
    'planar',
    'scheme',
    'vanguard',
    'token',
    'double_faced_token',
    'emblem',
    'augment',
    'host',
    'art_series',
    'reversible_card',
]);

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
    id: z.string(),
    name: z.string(),
    set: z.string(),
    setId: z.string(),
    collectorNum: z.string(),
    typeLine: z.string(),
    supertypes: z.array(SupertypeSchema),
    types: z.array(CardTypeSchema),
    subtypes: z.array(z.string()),
    isLegendary: z.boolean(),
    colors: z.array(ColorSchema).optional(),
    colorIdentity: z.array(ColorSchema).optional(),
    manaCost: z.string().optional(),
    cmc: z.number().optional(),
    oracleText: z.string().optional(),
    layout: LayoutSchema,
    faces: z.array(CardFaceSchema).nullable(),
    power: z.string().nullable(),
    toughness: z.string().nullable(),
    keywords: z.array(z.string()),
    producedMana: z.array(ColorSchema),
    gameChanger: z.boolean(),
    scryfallUri: z.string().url(),
    imageUri: z.string(),
    rawJson: z.record(z.string(), z.unknown()),
});
