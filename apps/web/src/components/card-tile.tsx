import type { CardSummary } from '@shared/search';

import type { CollectionMeta } from '../lib/use-collection';

type CardTileProps = {
  readonly card: CardSummary;
  readonly collectionMeta?: CollectionMeta;
};

export function CardTile({ card, collectionMeta }: CardTileProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg bg-gray-800 transition-all hover:ring-1 hover:ring-indigo-500">
      <div className="aspect-[488/680] w-full overflow-hidden">
        <img
          src={card.imageUri}
          alt={card.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="px-2 py-2">
        <p className="truncate text-sm font-medium text-gray-100">
          {card.name}
        </p>
        <p className="truncate text-xs text-gray-400">
          {card.typeLine}
        </p>
        {card.manaCost && (
          <p className="mt-0.5 text-xs text-gray-500">{card.manaCost}</p>
        )}
      </div>

      {collectionMeta && (
        <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
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
    </div>
  );
}
