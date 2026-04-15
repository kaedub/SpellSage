import type { CardSummary } from '@shared/search';

import { getCollectionCardsByTags } from '../../db/collection';
import { assignBuckets, type Bucket } from './bucket-assignment';
import type { ArchetypeRow } from './archetype-ranking';

/** Max share of non-land cards that may be pure-utility (no threat or interaction role) after shaping. */
const MAX_UTILITY_SHARE_NON_LAND = 0.4;

/** Upper bound on distinct cards kept for later deck-building steps. */
const MAX_POOL_SIZE = 100;

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'] as const;

export type CandidateCard = {
  readonly card: CardSummary;
  readonly quantity: number;
  /**
   * All deck roles this card can fill, in priority order (threat → interaction → utility, or ['land']).
   * Non-empty by construction; empty cards are excluded from the pool.
   * Downstream steps pick one role per card — a card may not fill two roles simultaneously.
   */
  readonly buckets: readonly Bucket[];
  /** Count of this card's tag slugs that appear in the archetype's `anti_tags` (soft signal for later steps). */
  readonly antiTagMatchCount: number;
};

/** The highest-value role a card can fill. Used for sorting and removal priority. */
function primaryBucket(buckets: readonly Bucket[]): Bucket {
  return buckets[0];
}

/** Lower value = removed first when trimming pool size. Lands are kept longest. */
function bucketRemovalRank(bucket: Bucket): number {
  switch (bucket) {
    case 'utility':
      return 0;
    case 'interaction':
      return 1;
    case 'threat':
      return 2;
    case 'land':
      return 3;
  }
}

/** For final sort: threat first, land last. */
function bucketDisplayOrder(bucket: Bucket): number {
  switch (bucket) {
    case 'threat':
      return 0;
    case 'interaction':
      return 1;
    case 'utility':
      return 2;
    case 'land':
      return 3;
  }
}

function mergeCollectionRows(
  rows: readonly { cardId: string; quantity: number; card: CardSummary }[],
  into: Map<string, { card: CardSummary; quantity: number }>,
): void {
  for (const row of rows) {
    const existing = into.get(row.cardId);
    if (existing === undefined) {
      into.set(row.cardId, { card: row.card, quantity: row.quantity });
    } else {
      existing.quantity += row.quantity;
    }
  }
}

function countArchetypeTagHits(card: CardSummary, archetypeTags: ReadonlySet<string>): number {
  let n = 0;
  for (const t of card.tags) {
    if (archetypeTags.has(t.tagSlug)) {
      n += 1;
    }
  }
  return n;
}

function countAntiTagMatches(card: CardSummary, antiTagSet: ReadonlySet<string>): number {
  let n = 0;
  for (const t of card.tags) {
    if (antiTagSet.has(t.tagSlug)) {
      n += 1;
    }
  }
  return n;
}

/**
 * A card is "pure utility" if utility is its only non-land role (it has no threat or interaction option).
 * These are the only cards that count toward the utility density cap.
 */
function isPureUtility(buckets: readonly Bucket[]): boolean {
  return buckets.length === 1 && buckets[0] === 'utility';
}

/**
 * Trims excess pure-utility cards (those with no threat/interaction role) when they exceed
 * MAX_UTILITY_SHARE_NON_LAND of the non-land pool. Lowest archetype-tag-hit cards removed first,
 * then alphabetically.
 */
function trimUtilityDensity(
  items: readonly CandidateCard[],
  archetypeTags: ReadonlySet<string>,
): CandidateCard[] {
  const nonLand = items.filter((c) => primaryBucket(c.buckets) !== 'land');
  if (nonLand.length === 0) {
    return [...items];
  }

  const pureUtility = nonLand.filter((c) => isPureUtility(c.buckets));
  const maxUtility = Math.floor(MAX_UTILITY_SHARE_NON_LAND * nonLand.length);
  if (pureUtility.length <= maxUtility) {
    return [...items];
  }

  const removeCount = pureUtility.length - maxUtility;
  const scored = pureUtility.map((c) => ({
    c,
    hits: countArchetypeTagHits(c.card, archetypeTags),
  }));
  scored.sort((a, b) => {
    if (a.hits !== b.hits) {
      return a.hits - b.hits;
    }
    return a.c.card.name.localeCompare(b.c.card.name);
  });

  const removeIds = new Set(scored.slice(0, removeCount).map((s) => s.c.card.id));
  return items.filter((c) => !removeIds.has(c.card.id));
}

/**
 * Picks the one or two most common colors in `colorIdentity` across the pool (by card incidence).
 * Tie-break: WUBRG order.
 */
function selectTopColorSet(items: readonly CandidateCard[]): ReadonlySet<string> {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const color of item.card.colorIdentity) {
      counts.set(color, (counts.get(color) ?? 0) + 1);
    }
  }

  const ranked = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }
    const ia = COLOR_ORDER.indexOf(a[0] as (typeof COLOR_ORDER)[number]);
    const ib = COLOR_ORDER.indexOf(b[0] as (typeof COLOR_ORDER)[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const selected = new Set<string>();
  if (ranked.length >= 1 && ranked[0][1] > 0) {
    selected.add(ranked[0][0]);
  }
  if (ranked.length >= 2 && ranked[1][1] > 0) {
    selected.add(ranked[1][0]);
  }
  return selected;
}

/**
 * Keeps cards whose color identity is a subset of the top 1–2 colors. Colorless cards (`[]`) are always kept.
 */
function applyColorTightening(items: readonly CandidateCard[]): CandidateCard[] {
  const selectedColors = selectTopColorSet(items);
  if (selectedColors.size === 0) {
    return [...items];
  }

  return items.filter((c) => {
    const id = c.card.colorIdentity;
    if (id.length === 0) {
      return true;
    }
    return id.every((col) => selectedColors.has(col));
  });
}

/**
 * Trims the pool to MAX_POOL_SIZE by removing lowest-value cards first: fewest archetype tag hits,
 * then worst primary bucket (utility before interaction before threat before land), then name.
 */
function capPoolSize(
  items: readonly CandidateCard[],
  archetypeTags: ReadonlySet<string>,
): CandidateCard[] {
  if (items.length <= MAX_POOL_SIZE) {
    return [...items];
  }

  const scored = items.map((c) => ({
    c,
    hits: countArchetypeTagHits(c.card, archetypeTags),
    rank: bucketRemovalRank(primaryBucket(c.buckets)),
  }));

  scored.sort((a, b) => {
    if (a.hits !== b.hits) {
      return a.hits - b.hits;
    }
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    return a.c.card.name.localeCompare(b.c.card.name);
  });

  const removeCount = items.length - MAX_POOL_SIZE;
  const removeIds = new Set(scored.slice(0, removeCount).map((s) => s.c.card.id));
  return items.filter((c) => !removeIds.has(c.card.id));
}

/**
 * Loads tag-matched cards from the collection, assigns all qualifying roles per card (multi-bucket),
 * drops unbucketed cards, then applies soft shaping: utility density cap, color tightening, pool size cap.
 * Lands are not fetched here; mana base construction is deferred to a later deck-building step.
 * Sort: primary role order (threat → interaction → utility → land), then name.
 */
export async function filterCandidatePool(
  collectionId: number,
  archetype: ArchetypeRow,
): Promise<CandidateCard[]> {
  const tagSlugs = [...archetype.core_tags, ...archetype.support_tags];
  const tagResult = await getCollectionCardsByTags(collectionId, tagSlugs);

  if (!tagResult.ok) {
    throw new Error(`Failed to load collection cards by tags: ${tagResult.error.message}`);
  }

  const byCardId = new Map<string, { card: CardSummary; quantity: number }>();
  mergeCollectionRows(tagResult.value, byCardId);

  const archetypeTags = new Set([...archetype.core_tags, ...archetype.support_tags]);
  const antiTagSet = new Set(archetype.anti_tags);

  const withBuckets: CandidateCard[] = [];
  for (const { card, quantity } of byCardId.values()) {
    const buckets = assignBuckets(card);
    if (buckets.length === 0) {
      continue;
    }
    withBuckets.push({
      card,
      quantity,
      buckets,
      antiTagMatchCount: countAntiTagMatches(card, antiTagSet),
    });
  }

  let shaped = trimUtilityDensity(withBuckets, archetypeTags);
  shaped = applyColorTightening(shaped);
  shaped = capPoolSize(shaped, archetypeTags);

  shaped.sort((a, b) => {
    const bo = bucketDisplayOrder(primaryBucket(a.buckets)) - bucketDisplayOrder(primaryBucket(b.buckets));
    if (bo !== 0) {
      return bo;
    }
    return a.card.name.localeCompare(b.card.name);
  });

  return shaped;
}
