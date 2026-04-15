import type { CardSummary } from '@shared/search';

export type Bucket = 'threat' | 'interaction' | 'utility' | 'land';

// TODO: These are hardcoded and should eventually come from the database
const THREAT_TAGS = [
  'threat',
  'sticky_threat',
  'token_maker',
] as const;

const INTERACTION_TAGS = [
  'cheap_interaction',
  'spot_removal',
  'counterspell',
  'hand_disruption',
  'bounce',
  'fight',
  'edict',
  'land_destruction',
  'mana_denial',
] as const;

const UTILITY_TAGS = [
  'card_draw',
  'card_selection',
  'tutor',
  'ramp',
  'mana_dork',
  'mana_rock',
  'land_ramp',
  'value_engine',
  'protection',
  'graveyard_enabler',
  'recursion',
  'reanimation',
] as const;

/**
 * All deck roles this card qualifies for. Returned in priority order: threat → interaction → utility.
 * Lands are always `['land']` (never mixed with other roles).
 * Returns an empty array when no tags match and the card is not a land — these are excluded from the pool.
 */
export function assignBuckets(card: CardSummary): Bucket[] {
  if (card.typeLine.includes('Land')) {
    return ['land'];
  }

  const tagSet = new Set(card.tags.map((t) => t.tagSlug));
  const buckets: Bucket[] = [];

  if (THREAT_TAGS.some((t) => tagSet.has(t))) {
    buckets.push('threat');
  }
  if (INTERACTION_TAGS.some((t) => tagSet.has(t))) {
    buckets.push('interaction');
  }
  if (UTILITY_TAGS.some((t) => tagSet.has(t))) {
    buckets.push('utility');
  }

  return buckets;
}
