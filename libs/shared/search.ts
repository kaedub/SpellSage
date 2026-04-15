import { z } from 'zod';

import { ColorSchema } from './schemas';

// --- Filter building blocks ---

export const ColorFilterModeSchema = z.enum(['exact', 'includes', 'at_most']);

export const ColorFilterSchema = z.object({
  mode: ColorFilterModeSchema,
  values: z.array(ColorSchema),
});

export const CmcFilterSchema = z.object({
  eq: z.number().optional(),
  gte: z.number().optional(),
  lte: z.number().optional(),
});

export const NumericRangeSchema = z.object({
  gte: z.number().int().optional(),
  lte: z.number().int().optional(),
});

export const CollectionFilterSchema = z
  .object({
    collectionId: z.number().int().optional(),
    userId: z.string().optional(),
    minQuantity: z.number().int().positive().optional(),
  })
  .refine(
    (f) => f.collectionId !== undefined || f.userId !== undefined,
    { message: 'Collection filter must specify at least collectionId or userId' },
  );

export const TagFilterSchema = z
  .object({
    all: z.array(z.string()).optional(),
    any: z.array(z.string()).optional(),
    none: z.array(z.string()).optional(),
  })
  .refine(
    (f) =>
      (f.all !== undefined && f.all.length > 0) ||
      (f.any !== undefined && f.any.length > 0) ||
      (f.none !== undefined && f.none.length > 0),
    { message: 'Tag filter must specify at least one of: all, any, none' },
  );

export const SortableFieldSchema = z.enum([
  'name',
  'cmc',
  'numericPower',
  'numericToughness',
]);

export const SortSchema = z.object({
  field: SortableFieldSchema,
  direction: z.enum(['asc', 'desc']),
});

export const CardRaritySchema = z.enum(['common', 'uncommon', 'rare', 'mythic']);

const MAX_LIMIT = 200;

/** Matches card grid column counts (2, 3, 4) so a full page has no trailing empty cells. */
export const DEFAULT_SEARCH_PAGE_LIMIT = 48;

export const PaginationSchema = z.object({
  limit: z.number().int().positive().max(MAX_LIMIT).default(DEFAULT_SEARCH_PAGE_LIMIT),
  offset: z.number().int().nonnegative().default(0),
});

// --- Composite search filter ---

export const CardSearchFilterSchema = z.object({
  name: z.string().optional(),
  rarity: z.array(CardRaritySchema).optional(),
  colors: ColorFilterSchema.optional(),
  colorIdentity: ColorFilterSchema.optional(),
  cmc: CmcFilterSchema.optional(),
  manaCost: z.string().optional(),
  types: z.array(z.string()).optional(),
  subtypes: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  oracleText: z.array(z.string()).optional(),
  isLegendary: z.boolean().optional(),
  power: NumericRangeSchema.optional(),
  toughness: NumericRangeSchema.optional(),
  producedMana: z.array(ColorSchema).optional(),
  tags: TagFilterSchema.optional(),
  collection: CollectionFilterSchema.optional(),
  sort: SortSchema.optional(),
  pagination: PaginationSchema.optional(),
});

// --- Result projection (matches Prisma return shape, not ingestion input) ---

export const CardTagSummarySchema = z.object({
  tagSlug: z.string(),
  groupSlug: z.string(),
});

export const CardSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  set: z.string(),
  manaCost: z.string().nullable(),
  cmc: z.number().nullable(),
  typeLine: z.string(),
  colors: z.array(z.string()),
  colorIdentity: z.array(z.string()),
  oracleText: z.string().nullable(),
  power: z.string().nullable(),
  toughness: z.string().nullable(),
  numericPower: z.number().int().nullable(),
  numericToughness: z.number().int().nullable(),
  keywords: z.array(z.string()),
  imageUri: z.string(),
  isLegendary: z.boolean(),
  tags: z.array(CardTagSummarySchema).default([]),
});

export const CardSearchResultSchema = z.object({
  cards: z.array(CardSummarySchema),
  total: z.number().int().nonnegative(),
  pagination: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
  }),
});

// --- Collection container ---

export const CollectionSchema = z.object({
  id: z.number().int(),
  userId: z.string(),
  name: z.string(),
  cardCount: z.number().int().nonnegative(),
});

// --- Collection card entry (card + ownership metadata) ---

export const CollectionCardEntrySchema = z.object({
  collectionCardId: z.number().int(),
  collectionId: z.number().int(),
  cardId: z.string(),
  quantity: z.number().int().positive(),
  foil: z.boolean(),
  card: CardSummarySchema,
});

export const CollectionCardsResponseSchema = z.object({
  items: z.array(CollectionCardEntrySchema),
  total: z.number().int().nonnegative(),
});

// --- Inferred types ---

export type ColorFilterMode = z.infer<typeof ColorFilterModeSchema>;
export type ColorFilter = z.infer<typeof ColorFilterSchema>;
export type CmcFilter = z.infer<typeof CmcFilterSchema>;
export type NumericRange = z.infer<typeof NumericRangeSchema>;
export type CollectionFilter = z.infer<typeof CollectionFilterSchema>;
export type TagFilter = z.infer<typeof TagFilterSchema>;
export type SortableField = z.infer<typeof SortableFieldSchema>;
export type Sort = z.infer<typeof SortSchema>;
export type CardRarity = z.infer<typeof CardRaritySchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type CardSearchFilter = z.infer<typeof CardSearchFilterSchema>;
export type CardTagSummary = z.infer<typeof CardTagSummarySchema>;
export type CardSummary = z.infer<typeof CardSummarySchema>;
export type CardSearchResult = z.infer<typeof CardSearchResultSchema>;
export type CollectionSummary = z.infer<typeof CollectionSchema>;
export type CollectionCardEntry = z.infer<typeof CollectionCardEntrySchema>;
export type CollectionCardsResponse = z.infer<typeof CollectionCardsResponseSchema>;
