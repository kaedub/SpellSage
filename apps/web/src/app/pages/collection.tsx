import { useCallback, useEffect, useRef, useState } from 'react';

import type { CardSearchFilter, Sort } from '@shared/search';
import type { CollectionSummary } from '@shared/search';

import { CardGrid } from '../../components/card-grid';
import { FilterPanel } from '../../components/filter-panel';
import { MobileFilterToggle } from '../../components/mobile-filter-toggle';
import { Pagination } from '../../components/pagination';
import { SortControl } from '../../components/sort-control';
import { type ApiError, getCollections } from '../../lib/api-client';
import { useCardSearch } from '../../lib/use-card-search';
import { useCollectionCards } from '../../lib/use-collection';

const SEED_USER_ID = 'seed-user';
const DEFAULT_SORT: Sort = { field: 'name', direction: 'asc' };
const PAGE_SIZE = 50;

function useUserCollections(userId: string) {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    getCollections(userId).then((result) => {
      if (id !== requestId.current) return;
      if (result.ok) {
        setCollections(result.value);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  }, [userId]);

  return { collections, loading, error };
}

export function CollectionPage() {
  const [filterFromPanel, setFilterFromPanel] = useState<CardSearchFilter>({});
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);
  const [offset, setOffset] = useState(0);

  const { collections, loading: collectionsLoading } = useUserCollections(SEED_USER_ID);
  const activeCollection = collections[0] ?? null;

  const filter: CardSearchFilter = {
    ...filterFromPanel,
    collection: activeCollection
      ? { collectionId: activeCollection.id }
      : { userId: SEED_USER_ID },
    sort,
    pagination: { limit: PAGE_SIZE, offset },
  };

  const { data, loading, error } = useCardSearch(filter);
  const {
    cardMap: collectionMap,
    loading: collectionLoading,
  } = useCollectionCards(activeCollection?.id ?? null);

  const handleFilterChange = useCallback(
    (next: CardSearchFilter) => {
      setFilterFromPanel(next);
      setOffset(0);
    },
    [],
  );

  const uniqueCards = collectionMap.size;
  const totalCards = Array.from(collectionMap.values()).reduce(
    (sum, m) => sum + m.quantity,
    0,
  );

  return (
    <div className="-mx-4 -mt-8 flex h-[calc(100vh-52px)] flex-col">
      {/* Collection header */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-gray-800 bg-gray-900 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-100">
          {activeCollection ? activeCollection.name : 'My Collection'}
        </h1>
        {!collectionsLoading && !collectionLoading && (
          <span className="text-sm text-gray-400">
            {totalCards.toLocaleString()} card{totalCards !== 1 ? 's' : ''}{' '}
            ({uniqueCards.toLocaleString()} unique)
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-gray-800 lg:block">
          <FilterPanel
            onFilterChange={handleFilterChange}
            collectionUserId={SEED_USER_ID}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile filter drawer */}
          <div className="border-b border-gray-800 lg:hidden">
            <MobileFilterToggle>
              <FilterPanel
                onFilterChange={handleFilterChange}
                collectionUserId={SEED_USER_ID}
              />
            </MobileFilterToggle>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 px-4 py-3">
            <SortControl value={sort} onChange={setSort} />
            {data && (
              <span className="text-sm text-gray-500">
                {data.total.toLocaleString()} result{data.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {error && (
              <div className="mb-4 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-300">
                {error.message}
              </div>
            )}

            {loading && !data ? (
              <div className="flex items-center justify-center py-20">
                <span className="text-gray-500">Loading&hellip;</span>
              </div>
            ) : (
              data && (
                <>
                  <div className={loading ? 'pointer-events-none opacity-50' : ''}>
                    <CardGrid
                      cards={data.cards}
                      collectionMap={collectionMap}
                    />
                  </div>

                  <div className="mt-4">
                    <Pagination
                      total={data.total}
                      limit={data.pagination.limit}
                      offset={data.pagination.offset}
                      onPageChange={setOffset}
                    />
                  </div>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
