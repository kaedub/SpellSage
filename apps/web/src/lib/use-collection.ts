import { useEffect, useRef, useState } from 'react';

import type { CollectionCardEntry } from '@shared/search';

import { type ApiError, getCollectionCards } from './api-client';

export type CollectionCardMeta = {
  readonly collectionCardId: number;
  readonly quantity: number;
  readonly foil: boolean;
};

export type CollectionCardsState = {
  readonly items: CollectionCardEntry[];
  readonly cardMap: ReadonlyMap<string, CollectionCardMeta>;
  readonly total: number;
  readonly loading: boolean;
  readonly error: ApiError | null;
};

function buildCardMap(
  items: CollectionCardEntry[],
): ReadonlyMap<string, CollectionCardMeta> {
  const map = new Map<string, CollectionCardMeta>();
  for (const item of items) {
    const existing = map.get(item.cardId);
    if (existing) {
      map.set(item.cardId, {
        collectionCardId: existing.collectionCardId,
        quantity: existing.quantity + item.quantity,
        foil: existing.foil || item.foil,
      });
    } else {
      map.set(item.cardId, {
        collectionCardId: item.collectionCardId,
        quantity: item.quantity,
        foil: item.foil,
      });
    }
  }
  return map;
}

export function useCollectionCards(collectionId: number | null): CollectionCardsState {
  const [state, setState] = useState<CollectionCardsState>({
    items: [],
    cardMap: new Map(),
    total: 0,
    loading: true,
    error: null,
  });

  const requestId = useRef(0);

  useEffect(() => {
    if (collectionId === null) {
      setState({ items: [], cardMap: new Map(), total: 0, loading: false, error: null });
      return;
    }

    const id = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    getCollectionCards(collectionId).then((result) => {
      if (id !== requestId.current) return;

      if (result.ok) {
        setState({
          items: result.value.items,
          cardMap: buildCardMap(result.value.items),
          total: result.value.total,
          loading: false,
          error: null,
        });
      } else {
        setState((prev) => ({ ...prev, loading: false, error: result.error }));
      }
    });
  }, [collectionId]);

  return state;
}
