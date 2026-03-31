import { Prisma } from '@prisma/client';

import type {
  CardSearchFilter,
  CardSearchResult,
  CmcFilter,
  CollectionFilter,
  ColorFilter,
  NumericRange,
} from '@shared/search';
import { ok, err } from '@shared/result';
import type { Result } from '@shared/result';

import { prisma } from '../adapters/prisma/client';

// --- SearchError ---

export type SearchError =
  | { kind: 'invalid_filter'; message: string }
  | { kind: 'database_error'; message: string };

// --- Prisma select for CardSummary projection ---

const CARD_SUMMARY_SELECT = {
  id: true,
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
} satisfies Prisma.CardSelect;

// --- Individual filter builders ---

function buildNameFilter(name: string): Prisma.CardWhereInput {
  return { name: { contains: name, mode: 'insensitive' } };
}

function buildColorFilter(
  filter: ColorFilter,
  field: 'colors' | 'colorIdentity',
): Prisma.CardWhereInput | undefined {
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

function buildCmcFilter(filter: CmcFilter): Prisma.CardWhereInput {
  const cmc: Record<string, number> = {};
  if (filter.eq !== undefined) cmc['equals'] = filter.eq;
  if (filter.gte !== undefined) cmc['gte'] = filter.gte;
  if (filter.lte !== undefined) cmc['lte'] = filter.lte;
  return { cmc };
}

function buildManaCostFilter(cost: string): Prisma.CardWhereInput {
  return { manaCost: { contains: cost } };
}

function buildArrayFilter(
  field: 'types' | 'subtypes' | 'keywords',
  values: string[],
): Prisma.CardWhereInput {
  return { [field]: { hasEvery: values } };
}

function buildOracleTextFilter(terms: string[]): Prisma.CardWhereInput {
  return {
    AND: terms.map(term => ({
      oracleText: { contains: term, mode: 'insensitive' as const },
    })),
  };
}

function buildLegendaryFilter(flag: boolean): Prisma.CardWhereInput {
  return { isLegendary: flag };
}

function buildNumericRangeFilter(
  field: 'numericPower' | 'numericToughness',
  range: NumericRange,
): Prisma.CardWhereInput {
  const conditions: Record<string, number> = {};
  if (range.gte !== undefined) conditions['gte'] = range.gte;
  if (range.lte !== undefined) conditions['lte'] = range.lte;
  return { [field]: conditions };
}

function buildProducedManaFilter(colors: string[]): Prisma.CardWhereInput {
  return { producedMana: { hasSome: colors } };
}

function buildCollectionFilter(filter: CollectionFilter): Prisma.CardWhereInput {
  return {
    collections: {
      some: {
        userId: filter.userId,
        ...(filter.minQuantity !== undefined
          ? { quantity: { gte: filter.minQuantity } }
          : {}),
      },
    },
  };
}

// --- Composer ---

function buildWhereClause(filter: CardSearchFilter): Prisma.CardWhereInput {
  const conditions: Prisma.CardWhereInput[] = [];

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
    conditions.push(buildArrayFilter('keywords', filter.keywords));
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
  if (filter.collection !== undefined) {
    conditions.push(buildCollectionFilter(filter.collection));
  }

  if (conditions.length === 0) return {};
  return { AND: conditions };
}

function buildOrderBy(filter: CardSearchFilter): Prisma.CardOrderByWithRelationInput {
  if (!filter.sort) return { name: 'asc' };
  return { [filter.sort.field]: filter.sort.direction };
}

// --- Public API ---

export async function searchCards(
  filter: CardSearchFilter,
): Promise<Result<CardSearchResult, SearchError>> {
  const limit = filter.pagination?.limit ?? 50;
  const offset = filter.pagination?.offset ?? 0;

  try {
    const where = buildWhereClause(filter);
    const orderBy = buildOrderBy(filter);

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        select: CARD_SUMMARY_SELECT,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.card.count({ where }),
    ]);

    return ok({
      cards,
      total,
      pagination: { limit, offset },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error' as const, message });
  }
}
