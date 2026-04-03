import { useCallback, useState } from 'react';

import type { CardSummary } from '@shared/search';

import type { CollectionCardMeta } from '../lib/use-collection';
import { CardDetailModal } from './card-detail-modal';
import { CardTile } from './card-tile';

type CardGridProps = {
  readonly cards: CardSummary[];
  readonly collectionMap?: ReadonlyMap<string, CollectionCardMeta>;
};

export function CardGrid({ cards, collectionMap }: CardGridProps) {
  const [selectedCard, setSelectedCard] = useState<CardSummary | null>(null);

  const handleSelect = useCallback((card: CardSummary) => {
    setSelectedCard(card);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedCard(null);
  }, []);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg">No cards found</p>
        <p className="mt-1 text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            collectionMeta={collectionMap?.get(card.id)}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          collectionMeta={collectionMap?.get(selectedCard.id)}
          onClose={handleClose}
        />
      )}
    </>
  );
}
