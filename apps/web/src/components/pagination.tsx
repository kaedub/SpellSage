type PaginationProps = {
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly onPageChange: (offset: number) => void;
};

export function Pagination({
  total,
  limit,
  offset,
  onPageChange,
}: PaginationProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, total);

  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3">
      <span className="text-sm text-gray-400">
        {total === 0 ? 'No results' : `Showing ${start}\u2013${end} of ${total}`}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(offset - limit)}
          className="rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:bg-gray-800"
        >
          Prev
        </button>

        <span className="text-sm text-gray-400">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(offset + limit)}
          className="rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:bg-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}
