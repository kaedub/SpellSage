import type { CollectionCardEntry } from '@shared/search';

export type CollectionTagOverviewRow = {
  readonly tagSlug: string;
  readonly groupSlug: string;
  readonly count: number;
};

export type CollectionTagOverviewResult = {
  readonly rows: readonly CollectionTagOverviewRow[];
  readonly untaggedUniqueCards: number;
};

/**
 * Aggregates tag counts across unique cards in a collection (dedupes by cardId).
 * Each tag on a card increments that tag's count by 1.
 */
export function buildCollectionTagOverview(
  items: readonly CollectionCardEntry[],
): CollectionTagOverviewResult {
  const byCardId = new Map<string, CollectionCardEntry>();
  for (const item of items) {
    if (!byCardId.has(item.cardId)) {
      byCardId.set(item.cardId, item);
    }
  }

  const tagCounts = new Map<
    string,
    { groupSlug: string; count: number }
  >();
  let untaggedUniqueCards = 0;

  for (const entry of byCardId.values()) {
    const tags = entry.card.tags;
    if (tags.length === 0) {
      untaggedUniqueCards += 1;
      continue;
    }

    for (const t of tags) {
      const key = t.tagSlug;
      const existing = tagCounts.get(key);
      if (existing === undefined) {
        tagCounts.set(key, { groupSlug: t.groupSlug, count: 1 });
      } else {
        tagCounts.set(key, {
          groupSlug: existing.groupSlug,
          count: existing.count + 1,
        });
      }
    }
  }

  const rows: CollectionTagOverviewRow[] = [...tagCounts.entries()].map(
    ([tagSlug, { groupSlug, count }]) => ({
      tagSlug,
      groupSlug,
      count,
    }),
  );

  rows.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.tagSlug.localeCompare(b.tagSlug);
  });

  return { rows, untaggedUniqueCards };
}
