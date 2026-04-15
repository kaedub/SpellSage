import { describe, expect, it } from 'vitest';

import type { CardSummary } from '@shared/search';

import { assignBuckets } from './bucket-assignment';

function minimalCard(
  overrides: Pick<CardSummary, 'typeLine' | 'tags'> & Partial<CardSummary>,
): CardSummary {
  return {
    id: 'x',
    name: 'Test Card',
    set: 'tst',
    manaCost: null,
    cmc: null,
    colors: [],
    colorIdentity: [],
    oracleText: null,
    power: null,
    toughness: null,
    numericPower: null,
    numericToughness: null,
    keywords: [],
    imageUri: '',
    isLegendary: false,
    ...overrides,
  };
}

describe('assignBuckets', () => {
  it('classifies pure threat', () => {
    expect(
      assignBuckets(
        minimalCard({ typeLine: 'Creature', tags: [{ tagSlug: 'threat', groupSlug: 'role' }] }),
      ),
    ).toEqual(['threat']);
  });

  it('classifies pure utility from card_draw', () => {
    expect(
      assignBuckets(
        minimalCard({ typeLine: 'Instant', tags: [{ tagSlug: 'card_draw', groupSlug: 'role' }] }),
      ),
    ).toEqual(['utility']);
  });

  it('classifies pure interaction from spot_removal', () => {
    expect(
      assignBuckets(
        minimalCard({ typeLine: 'Instant', tags: [{ tagSlug: 'spot_removal', groupSlug: 'role' }] }),
      ),
    ).toEqual(['interaction']);
  });

  it('returns both threat and utility for a card with both tags (threat first)', () => {
    expect(
      assignBuckets(
        minimalCard({
          typeLine: 'Creature',
          tags: [
            { tagSlug: 'threat', groupSlug: 'role' },
            { tagSlug: 'card_draw', groupSlug: 'role' },
          ],
        }),
      ),
    ).toEqual(['threat', 'utility']);
  });

  it('returns both threat and interaction for a token-making removal spell', () => {
    expect(
      assignBuckets(
        minimalCard({
          typeLine: 'Instant',
          tags: [
            { tagSlug: 'token_maker', groupSlug: 'role' },
            { tagSlug: 'spot_removal', groupSlug: 'role' },
          ],
        }),
      ),
    ).toEqual(['threat', 'interaction']);
  });

  it('classifies mana_dork as utility', () => {
    expect(
      assignBuckets(
        minimalCard({ typeLine: 'Creature', tags: [{ tagSlug: 'mana_dork', groupSlug: 'role' }] }),
      ),
    ).toEqual(['utility']);
  });

  it('returns empty array for non-land with no bucket tags', () => {
    expect(assignBuckets(minimalCard({ typeLine: 'Artifact', tags: [] }))).toEqual([]);
  });

  it('classifies basic land by type line even with empty tags', () => {
    expect(
      assignBuckets(minimalCard({ typeLine: 'Basic Land — Forest', tags: [] })),
    ).toEqual(['land']);
  });

  it('land type line wins over any tags', () => {
    expect(
      assignBuckets(
        minimalCard({
          typeLine: 'Land Creature — Forest',
          tags: [{ tagSlug: 'threat', groupSlug: 'role' }],
        }),
      ),
    ).toEqual(['land']);
  });
});
