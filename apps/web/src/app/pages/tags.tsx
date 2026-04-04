import { useEffect, useRef, useState } from 'react';

import type { TagTaxonomy } from '@shared/tag-taxonomy';

import { type ApiError, getTagTaxonomy } from '../../lib/api-client';

function formatList(items: readonly string[]): string {
  if (items.length === 0) {
    return '—';
  }
  return items.join(', ');
}

export function TagsPage() {
  const [taxonomy, setTaxonomy] = useState<TagTaxonomy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    getTagTaxonomy().then((result) => {
      if (id !== requestId.current) return;
      if (result.ok) {
        setTaxonomy(result.value);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="text-center text-gray-400">Loading tags…</div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-red-200">
        {error.message}
      </div>
    );
  }

  if (!taxonomy || taxonomy.groups.length === 0) {
    return (
      <div className="text-center text-gray-400">No tag groups found.</div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">
          Tags
        </h1>
        <p className="mt-2 max-w-2xl text-gray-400">
          Tag definitions grouped by category. Each tag lists criteria the
          card must satisfy (must have) and must not satisfy (must not have).
        </p>
      </div>

      {taxonomy.groups.map((group) => (
        <section key={group.slug} className="flex flex-col gap-4">
          <div className="border-b border-gray-800 pb-2">
            <h2 className="text-lg font-semibold text-gray-100">{group.slug}</h2>
            {group.description ? (
              <p className="mt-1 text-sm text-gray-400">{group.description}</p>
            ) : null}
          </div>

          <ul className="flex flex-col gap-4">
            {group.tags.map((tag) => (
              <li
                key={tag.slug}
                className="rounded-lg border border-gray-800 bg-gray-900/50 p-4"
              >
                <h3 className="font-mono text-sm font-semibold text-teal-400">
                  {tag.slug}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-200">
                  {tag.definition}
                </p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-gray-500">Must have</dt>
                    <dd className="mt-1 text-gray-300">
                      {formatList(tag.mustHave)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Must not have</dt>
                    <dd className="mt-1 text-gray-300">
                      {formatList(tag.mustNotHave)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
