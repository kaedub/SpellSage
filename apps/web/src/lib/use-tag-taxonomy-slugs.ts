import { useEffect, useRef, useState } from 'react';

import type { TagTaxonomy } from '@shared/tag-taxonomy';
import type { Result } from '@shared/result';

import { type ApiError, getTagTaxonomy } from './api-client';

export type TagTaxonomySlugsState = {
  readonly sortedSlugs: readonly string[];
  readonly loading: boolean;
  readonly error: ApiError | null;
};

type TaxonomyLoadResult = Result<TagTaxonomy, ApiError>;

let taxonomyCache: TaxonomyLoadResult | undefined;
let taxonomyInFlight: Promise<TaxonomyLoadResult> | undefined;

function loadTaxonomyDeduped(): Promise<TaxonomyLoadResult> {
  if (taxonomyCache !== undefined) {
    return Promise.resolve(taxonomyCache);
  }
  if (taxonomyInFlight !== undefined) {
    return taxonomyInFlight;
  }
  taxonomyInFlight = getTagTaxonomy().then((result) => {
    taxonomyCache = result;
    taxonomyInFlight = undefined;
    return result;
  });
  return taxonomyInFlight;
}

function sortedSlugsFromResult(result: TaxonomyLoadResult): readonly string[] {
  if (!result.ok) {
    return [];
  }
  return [...result.value.allSlugs].sort((a, b) => a.localeCompare(b));
}

/**
 * Loads tag slugs from GET /api/tags once per session; returns alphabetically sorted slugs for pickers.
 */
export function useTagTaxonomySlugs(): TagTaxonomySlugsState {
  const [sortedSlugs, setSortedSlugs] = useState<readonly string[]>(() =>
    taxonomyCache !== undefined ? sortedSlugsFromResult(taxonomyCache) : [],
  );
  const [loading, setLoading] = useState(taxonomyCache === undefined);
  const [error, setError] = useState<ApiError | null>(() =>
    taxonomyCache !== undefined && !taxonomyCache.ok ? taxonomyCache.error : null,
  );
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;

    if (taxonomyCache !== undefined) {
      const r = taxonomyCache;
      setSortedSlugs(sortedSlugsFromResult(r));
      setError(r.ok ? null : r.error);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    loadTaxonomyDeduped().then((result) => {
      if (id !== requestId.current) {
        return;
      }
      setSortedSlugs(sortedSlugsFromResult(result));
      setError(result.ok ? null : result.error);
      setLoading(false);
    });
  }, []);

  return { sortedSlugs, loading, error };
}
