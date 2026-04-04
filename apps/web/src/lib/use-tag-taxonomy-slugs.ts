import { useEffect, useRef, useState } from 'react';

import { type ApiError, getTagTaxonomy } from './api-client';

export type TagTaxonomySlugsState = {
  readonly sortedSlugs: readonly string[];
  readonly loading: boolean;
  readonly error: ApiError | null;
};

/**
 * Loads tag slugs from GET /api/tags once; returns alphabetically sorted slugs for pickers.
 */
export function useTagTaxonomySlugs(): TagTaxonomySlugsState {
  const [sortedSlugs, setSortedSlugs] = useState<readonly string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    getTagTaxonomy().then((result) => {
      if (id !== requestId.current) {
        return;
      }
      if (result.ok) {
        setSortedSlugs(
          [...result.value.allSlugs].sort((a, b) => a.localeCompare(b)),
        );
        setError(null);
      } else {
        setSortedSlugs([]);
        setError(result.error);
      }
      setLoading(false);
    });
  }, []);

  return { sortedSlugs, loading, error };
}
