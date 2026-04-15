import { Prisma } from '@prisma/client';

import type {
  CardSearchFilter,
  CardSearchResult,
  CardSummary,
  CmcFilter,
  CollectionFilter,
  ColorFilter,
  NumericRange,
  TagFilter,
} from '@shared/search';
import { DEFAULT_SEARCH_PAGE_LIMIT } from '@shared/search';
import { ok, err } from '@shared/result';
import type { Result } from '@shared/result';

import { prisma } from '../adapters/prisma/client';

// --- SearchError ---

export type SearchError =
  | { kind: 'invalid_filter'; message: string }
  | { kind: 'database_error'; message: string };

// --- Prisma select for CardSummary projection ---

export const CARD_SUMMARY_SELECT = {
  oracleId: true,
  name: true,
  set: true,
  manaCost: true,
  cmc: true,
  typeLine: true,
  colors: true,
  colorIdentity: true,
  oracleText: true,
  power: true,
  toughness: true,
  numericPower: true,
  numericToughness: true,
  keywords: true,
  imageUri: true,
  isLegendary: true,
  tags: {
    select: {
      tagSlug: true,
      tag: { select: { groupSlug: true } },
    },
  },
} satisfies Prisma.OracleCardSelect;

type RawCardSummaryRow = Omit<CardSummary, 'tags' | 'id'> & {
  oracleId: string;
  tags: Array<{ tagSlug: string; tag: { groupSlug: string } }>;
};

export function toCardSummary(row: RawCardSummaryRow): CardSummary {
  return {
    id: row.oracleId,
    name: row.name,
    set: row.set,
    manaCost: row.manaCost,
    cmc: row.cmc,
    typeLine: row.typeLine,
    colors: row.colors,
    colorIdentity: row.colorIdentity,
    oracleText: row.oracleText,
    power: row.power,
    toughness: row.toughness,
    numericPower: row.numericPower,
    numericToughness: row.numericToughness,
    keywords: row.keywords,
    imageUri: row.imageUri,
    isLegendary: row.isLegendary,
    tags: row.tags.map((t) => ({
      tagSlug: t.tagSlug,
      groupSlug: t.tag.groupSlug,
    })),
  };
}

// --- Individual filter builders ---

function buildNameFilter(name: string): Prisma.OracleCardWhereInput {
  return { name: { contains: name, mode: 'insensitive' } };
}

function buildColorFilter(
  filter: ColorFilter,
  field: 'colors' | 'colorIdentity',
): Prisma.OracleCardWhereInput | undefined {
  const sorted = [...filter.values].sort();

  switch (filter.mode) {
    case 'exact':
      return { [field]: { equals: sorted } };
    case 'includes':
      return { [field]: { hasEvery: sorted } };
    case 'at_most':
      // Deferred to Phase 2 (requires raw SQL for array subset)
      return undefined;
  }
}

function buildCmcFilter(filter: CmcFilter): Prisma.OracleCardWhereInput {
  const cmc: Record<string, number> = {};
  if (filter.eq !== undefined) cmc['equals'] = filter.eq;
  if (filter.gte !== undefined) cmc['gte'] = filter.gte;
  if (filter.lte !== undefined) cmc['lte'] = filter.lte;
  return { cmc };
}

function buildManaCostFilter(cost: string): Prisma.OracleCardWhereInput {
  return { manaCost: { contains: cost } };
}

function buildArrayFilter(
  field: 'types' | 'subtypes',
  values: string[],
): Prisma.OracleCardWhereInput {
  return { [field]: { hasEvery: values } };
}

function buildKeywordsCiFilter(values: string[]): Prisma.OracleCardWhereInput {
  return {
    keywordsCi: { hasEvery: values.map((v) => v.toLowerCase()) },
  };
}

function buildOracleTextFilter(terms: string[]): Prisma.OracleCardWhereInput {
  return {
    AND: terms.map(term => ({
      oracleText: { contains: term, mode: 'insensitive' as const },
    })),
  };
}

function buildLegendaryFilter(flag: boolean): Prisma.OracleCardWhereInput {
  return { isLegendary: flag };
}

function buildNumericRangeFilter(
  field: 'numericPower' | 'numericToughness',
  range: NumericRange,
): Prisma.OracleCardWhereInput {
  const conditions: Record<string, number> = {};
  if (range.gte !== undefined) conditions['gte'] = range.gte;
  if (range.lte !== undefined) conditions['lte'] = range.lte;
  return { [field]: conditions };
}

function buildProducedManaFilter(colors: string[]): Prisma.OracleCardWhereInput {
  return { producedMana: { hasSome: colors } };
}

function buildCollectionFilter(filter: CollectionFilter): Prisma.OracleCardWhereInput {
  const quantityClause =
    filter.minQuantity !== undefined ? { quantity: { gte: filter.minQuantity } } : {};

  if (filter.collectionId !== undefined) {
    return {
      collectionPrintings: {
        some: {
          collectionId: filter.collectionId,
          ...quantityClause,
        },
      },
    };
  }

  return {
    collectionPrintings: {
      some: {
        collection: { userId: filter.userId },
        ...quantityClause,
      },
    },
  };
}

function buildTagFilter(filter: TagFilter): Prisma.OracleCardWhereInput[] {
  const conditions: Prisma.OracleCardWhereInput[] = [];

  if (filter.all !== undefined && filter.all.length > 0) {
    for (const tagSlug of filter.all) {
      conditions.push({ tags: { some: { tagSlug } } });
    }
  }

  if (filter.any !== undefined && filter.any.length > 0) {
    conditions.push({ tags: { some: { tagSlug: { in: filter.any } } } });
  }

  if (filter.none !== undefined && filter.none.length > 0) {
    conditions.push({ tags: { none: { tagSlug: { in: filter.none } } } });
  }

  return conditions;
}

// --- Composer ---

function buildWhereClause(filter: CardSearchFilter): Prisma.OracleCardWhereInput {
  const conditions: Prisma.OracleCardWhereInput[] = [];

  if (filter.name !== undefined) {
    conditions.push(buildNameFilter(filter.name));
  }
  if (filter.colors !== undefined) {
    const clause = buildColorFilter(filter.colors, 'colors');
    if (clause) conditions.push(clause);
  }
  if (filter.colorIdentity !== undefined) {
    const clause = buildColorFilter(filter.colorIdentity, 'colorIdentity');
    if (clause) conditions.push(clause);
  }
  if (filter.cmc !== undefined) {
    conditions.push(buildCmcFilter(filter.cmc));
  }
  if (filter.manaCost !== undefined) {
    conditions.push(buildManaCostFilter(filter.manaCost));
  }
  if (filter.types !== undefined) {
    conditions.push(buildArrayFilter('types', filter.types));
  }
  if (filter.subtypes !== undefined) {
    conditions.push(buildArrayFilter('subtypes', filter.subtypes));
  }
  if (filter.keywords !== undefined) {
    conditions.push(buildKeywordsCiFilter(filter.keywords));
  }
  if (filter.oracleText !== undefined) {
    conditions.push(buildOracleTextFilter(filter.oracleText));
  }
  if (filter.isLegendary !== undefined) {
    conditions.push(buildLegendaryFilter(filter.isLegendary));
  }
  if (filter.power !== undefined) {
    conditions.push(buildNumericRangeFilter('numericPower', filter.power));
  }
  if (filter.toughness !== undefined) {
    conditions.push(buildNumericRangeFilter('numericToughness', filter.toughness));
  }
  if (filter.producedMana !== undefined) {
    conditions.push(buildProducedManaFilter(filter.producedMana));
  }
  if (filter.tags !== undefined) {
    conditions.push(...buildTagFilter(filter.tags));
  }
  if (filter.collection !== undefined) {
    conditions.push(buildCollectionFilter(filter.collection));
  }

  if (conditions.length === 0) return {};
  return { AND: conditions };
}

function buildOrderBy(filter: CardSearchFilter): Prisma.OracleCardOrderByWithRelationInput {
  if (!filter.sort) return { name: 'asc' };
  return { [filter.sort.field]: filter.sort.direction };
}

// --- Public API ---

export async function searchCards(
  filter: CardSearchFilter,
): Promise<Result<CardSearchResult, SearchError>> {
  const limit = filter.pagination?.limit ?? DEFAULT_SEARCH_PAGE_LIMIT;
  const offset = filter.pagination?.offset ?? 0;

  try {
    const where = buildWhereClause(filter);
    const orderBy = buildOrderBy(filter);

    const [rawCards, total] = await Promise.all([
      prisma.oracleCard.findMany({
        where,
        select: CARD_SUMMARY_SELECT,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.oracleCard.count({ where }),
    ]);

    return ok({
      cards: rawCards.map(toCardSummary),
      total,
      pagination: { limit, offset },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error' as const, message });
  }
}
