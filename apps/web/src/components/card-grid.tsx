import type { CardSummary } from '@shared/search';

import type { CollectionCardMeta } from '../lib/use-collection';
import { CardTile } from './card-tile';

type CardGridProps = {
  readonly cards: CardSummary[];
  readonly collectionMap?: ReadonlyMap<string, CollectionCardMeta>;
};

export function CardGrid({ cards, collectionMap }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg">No cards found</p>
        <p className="mt-1 text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {cards.map((card) => (
        <CardTile
          key={card.id}
          card={card}
          collectionMeta={collectionMap?.get(card.id)}
        />
      ))}
    </div>
  );
}
