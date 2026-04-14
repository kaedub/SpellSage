import type { CardSummary } from '@shared/search';

import { getCollectionCardsByTags } from '../../db/collection';
import type { ArchetypeRow } from './archetype-ranking';

export type CandidateCard = {
  readonly card: CardSummary;
  readonly quantity: number;
};

/**
 * Cards in the collection that match at least one core or support tag for the archetype.
 * Foil and non-foil rows are merged; quantity is total copies owned.
 */
export async function filterCandidatePool(
  collectionId: number,
  archetype: ArchetypeRow,
): Promise<CandidateCard[]> {
  const tagSlugs = [...archetype.core_tags, ...archetype.support_tags];
  const result = await getCollectionCardsByTags(collectionId, tagSlugs);
  if (!result.ok) {
    throw new Error(`Failed to load collection cards by tags: ${result.error.message}`);
  }

  const byCardId = new Map<string, { card: CardSummary; quantity: number }>();
  for (const row of result.value) {
    const existing = byCardId.get(row.cardId);
    if (existing === undefined) {
      byCardId.set(row.cardId, { card: row.card, quantity: row.quantity });
    } else {
      existing.quantity += row.quantity;
    }
  }

  return [...byCardId.values()]
    .map(({ card, quantity }) => ({ card, quantity }))
    .sort((a, b) => a.card.name.localeCompare(b.card.name));
}
