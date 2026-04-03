import { useEffect, useRef, useState } from 'react';

import type { CollectionEntry } from '@shared/search';

import { type ApiError, getCollection } from './api-client';

export type CollectionMeta = {
  readonly collectionId: number;
  readonly quantity: number;
  readonly foil: boolean;
};

export type CollectionState = {
  readonly items: CollectionEntry[];
  readonly collectionMap: ReadonlyMap<string, CollectionMeta>;
  readonly total: number;
  readonly loading: boolean;
  readonly error: ApiError | null;
};

function buildCollectionMap(
  items: CollectionEntry[],
): ReadonlyMap<string, CollectionMeta> {
  const map = new Map<string, CollectionMeta>();
  for (const item of items) {
    const existing = map.get(item.cardId);
    if (existing) {
      map.set(item.cardId, {
        collectionId: existing.collectionId,
        quantity: existing.quantity + item.quantity,
        foil: existing.foil || item.foil,
      });
    } else {
      map.set(item.cardId, {
        collectionId: item.collectionId,
        quantity: item.quantity,
        foil: item.foil,
      });
    }
  }
  return map;
}

export function useCollection(userId: string): CollectionState {
  const [state, setState] = useState<CollectionState>({
    items: [],
    collectionMap: new Map(),
    total: 0,
    loading: true,
    error: null,
  });

  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    getCollection(userId).then((result) => {
      if (id !== requestId.current) return;

      if (result.ok) {
        setState({
          items: result.value.items,
          collectionMap: buildCollectionMap(result.value.items),
          total: result.value.total,
          loading: false,
          error: null,
        });
      } else {
        setState((prev) => ({ ...prev, loading: false, error: result.error }));
      }
    });
  }, [userId]);

  return state;
}
