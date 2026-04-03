import { useCallback, useState } from 'react';

import type { CardSearchFilter, Sort } from '@shared/search';

import { CardGrid } from '../../components/card-grid';
import { FilterPanel } from '../../components/filter-panel';
import { MobileFilterToggle } from '../../components/mobile-filter-toggle';
import { Pagination } from '../../components/pagination';
import { SortControl } from '../../components/sort-control';
import { useCardSearch } from '../../lib/use-card-search';

const DEFAULT_SORT: Sort = { field: 'name', direction: 'asc' };
const PAGE_SIZE = 50;

export function SearchPage() {
  const [filterFromPanel, setFilterFromPanel] = useState<CardSearchFilter>({});
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);
  const [offset, setOffset] = useState(0);

  const filter: CardSearchFilter = {
    ...filterFromPanel,
    sort,
    pagination: { limit: PAGE_SIZE, offset },
  };

  const { data, loading, error } = useCardSearch(filter);

  const handleFilterChange = useCallback(
    (next: CardSearchFilter) => {
      setFilterFromPanel(next);
      setOffset(0);
    },
    [],
  );

  return (
    <div className="-mx-4 -mt-8 flex h-[calc(100vh-52px)]">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-800 lg:block">
        <FilterPanel onFilterChange={handleFilterChange} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile filter drawer */}
        <div className="border-b border-gray-800 lg:hidden">
          <MobileFilterToggle>
            <FilterPanel onFilterChange={handleFilterChange} />
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
                  <CardGrid cards={data.cards} />
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
  );
}
