import type { CollectionCardEntry } from '@shared/search';
import { Link } from 'react-router-dom';

import type { ApiError } from '../lib/api-client';
import { buildCollectionTagOverview } from '../lib/collection-tag-overview';

function hrefForCollectionTagFilter(tagSlug: string): string {
  const qs = new URLSearchParams({ tag: tagSlug, tagMode: 'any' });
  return `/collection?${qs.toString()}`;
}

export type CollectionTagOverviewProps = {
  readonly items: readonly CollectionCardEntry[];
  readonly loading: boolean;
  readonly error: ApiError | null;
};

function TagRow({
  primary,
  secondary,
  count,
}: {
  primary: string;
  secondary: string | null;
  count: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-gray-800 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="font-mono text-sm font-medium text-teal-400">{primary}</div>
        {secondary ? (
          <div className="mt-0.5 text-xs text-gray-500">{secondary}</div>
        ) : null}
      </div>
      <div className="shrink-0 tabular-nums text-sm text-gray-300">
        {count.toLocaleString()}
      </div>
    </div>
  );
}

function TagRowLink({
  tagSlug,
  groupSlug,
  count,
}: {
  tagSlug: string;
  groupSlug: string;
  count: number;
}) {
  return (
    <Link
      to={hrefForCollectionTagFilter(tagSlug)}
      className="-mx-4 flex items-baseline justify-between gap-4 border-b border-gray-800 px-4 py-3 last:border-b-0 transition-colors hover:bg-gray-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
    >
      <div className="min-w-0">
        <div className="font-mono text-sm font-medium text-teal-400">{tagSlug}</div>
        <div className="mt-0.5 text-xs text-gray-500">{groupSlug}</div>
      </div>
      <div className="shrink-0 tabular-nums text-sm text-gray-300">
        {count.toLocaleString()}
      </div>
    </Link>
  );
}

export function CollectionTagOverview({
  items,
  loading,
  error,
}: CollectionTagOverviewProps) {
  if (error) {
    return (
      <div className="rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-300">
        {error.message}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-500">Loading&hellip;</span>
      </div>
    );
  }

  const { rows, untaggedUniqueCards } = buildCollectionTagOverview(items);

  if (rows.length === 0 && untaggedUniqueCards === 0) {
    return (
      <p className="text-center text-sm text-gray-500">
        No cards in this collection yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {rows.length > 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 px-4">
          {rows.map((row) => (
            <TagRowLink
              key={row.tagSlug}
              tagSlug={row.tagSlug}
              groupSlug={row.groupSlug}
              count={row.count}
            />
          ))}
        </div>
      ) : null}

      <div
        className={
          rows.length > 0
            ? 'mt-4 rounded-lg border border-gray-700 bg-gray-900/60 px-4'
            : 'rounded-lg border border-gray-700 bg-gray-900/60 px-4'
        }
      >
        <TagRow
          primary="Untagged"
          secondary={null}
          count={untaggedUniqueCards}
        />
      </div>
    </div>
  );
}
