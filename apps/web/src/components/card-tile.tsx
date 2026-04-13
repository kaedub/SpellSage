import type { CardSummary } from '@shared/search';

import type { CollectionCardMeta } from '../lib/use-collection';

type CardTileProps = {
  readonly card: CardSummary;
  readonly collectionMeta?: CollectionCardMeta;
  readonly onSelect: (card: CardSummary) => void;
};

export function CardTile({ card, collectionMeta, onSelect }: CardTileProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(card)}
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-gray-800 text-left transition-all hover:ring-1 hover:ring-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="aspect-[488/680] w-full overflow-hidden">
        <img
          src={card.imageUri}
          alt={card.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {collectionMeta && (
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white shadow">
            x{collectionMeta.quantity}
          </span>
          {collectionMeta.foil && (
            <span className="rounded-full bg-amber-500/90 px-1.5 py-0.5 text-xs font-bold text-white shadow">
              F
            </span>
          )}
        </div>
      )}
    </button>
  );
}
