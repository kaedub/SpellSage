import { useEffect, useRef, useState } from 'react';

import type { CardSearchFilter, CardSearchResult } from '@shared/search';

import { type ApiError, searchCards } from './api-client';

export type CardSearchState = {
  readonly data: CardSearchResult | null;
  readonly loading: boolean;
  readonly error: ApiError | null;
};

export function useCardSearch(filter: CardSearchFilter): CardSearchState {
  const [state, setState] = useState<CardSearchState>({
    data: null,
    loading: true,
    error: null,
  });

  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    searchCards(filter).then((result) => {
      if (id !== requestId.current) return;

      if (result.ok) {
        setState({ data: result.value, loading: false, error: null });
      } else {
        setState((prev) => ({ ...prev, loading: false, error: result.error }));
      }
    });
  }, [JSON.stringify(filter)]);

  return state;
}
