import { useCallback, useMemo, useState } from 'react';

export type TagFilterInputProps = {
  readonly slugs: readonly string[];
  readonly draft: string;
  readonly onSlugsChange: (next: readonly string[]) => void;
  readonly onDraftChange: (draft: string) => void;
  readonly allSlugs: readonly string[];
  readonly taxonomyLoading: boolean;
  readonly taxonomyErrorMessage: string | null;
};

function commitToken(
  token: string,
  slugs: readonly string[],
): { nextSlugs: string[]; cleared: boolean } {
  const t = token.trim();
  if (t.length === 0) {
    return { nextSlugs: [...slugs], cleared: true };
  }
  if (slugs.includes(t)) {
    return { nextSlugs: [...slugs], cleared: true };
  }
  return { nextSlugs: [...slugs, t], cleared: true };
}

export function TagFilterInput({
  slugs,
  draft,
  onSlugsChange,
  onDraftChange,
  allSlugs,
  taxonomyLoading,
  taxonomyErrorMessage,
}: TagFilterInputProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const commitDraft = useCallback(() => {
    const { nextSlugs, cleared } = commitToken(draft, slugs);
    if (cleared) {
      onDraftChange('');
    }
    if (nextSlugs.length !== slugs.length || nextSlugs.some((s, i) => s !== slugs[i])) {
      onSlugsChange(nextSlugs);
    }
  }, [draft, slugs, onDraftChange, onSlugsChange]);

  const addSlug = useCallback(
    (slug: string) => {
      if (slugs.includes(slug)) {
        onDraftChange('');
        return;
      }
      onSlugsChange([...slugs, slug]);
      onDraftChange('');
    },
    [slugs, onSlugsChange, onDraftChange],
  );

  const removeSlug = useCallback(
    (slug: string) => {
      onSlugsChange(slugs.filter((s) => s !== slug));
    },
    [slugs, onSlugsChange],
  );

  const filteredSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return allSlugs.filter(
      (s) => !slugs.includes(s) && (q.length === 0 || s.toLowerCase().includes(q)),
    );
  }, [allSlugs, slugs, draft]);

  const showDropdown =
    dropdownOpen && !taxonomyLoading && filteredSuggestions.length > 0;

  return (
    <div className="relative w-full">
      <div className="flex min-h-[2.5rem] w-full flex-wrap items-center gap-1.5 rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm focus-within:border-indigo-500">
        {slugs.map((slug) => (
          <span
            key={slug}
            className="inline-flex max-w-full items-center gap-1 rounded-md bg-gray-700/90 px-2 py-0.5 font-mono text-xs text-teal-300"
          >
            <span className="truncate">{slug}</span>
            <button
              type="button"
              onClick={() => removeSlug(slug)}
              className="shrink-0 rounded px-0.5 text-gray-400 hover:bg-gray-600 hover:text-gray-100"
              aria-label={`Remove tag ${slug}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={slugs.length === 0 ? 'e.g. removal, ramp' : 'Add tag…'}
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            if (v.endsWith(',')) {
              const part = v.slice(0, -1);
              const { nextSlugs, cleared } = commitToken(part, slugs);
              if (cleared) {
                onDraftChange('');
              }
              if (
                nextSlugs.length !== slugs.length ||
                nextSlugs.some((s, i) => s !== slugs[i])
              ) {
                onSlugsChange(nextSlugs);
              }
              return;
            }
            onDraftChange(v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitDraft();
              return;
            }
            if (e.key === 'Backspace' && draft.length === 0 && slugs.length > 0) {
              e.preventDefault();
              onSlugsChange(slugs.slice(0, -1));
            }
          }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => {
            commitDraft();
            setDropdownOpen(false);
          }}
          className="min-w-[6rem] flex-1 border-0 bg-transparent py-1 text-sm text-gray-100 placeholder-gray-500 outline-none"
        />
      </div>

      {taxonomyLoading ? (
        <p className="mt-1 text-xs text-gray-500">Loading tag list…</p>
      ) : null}
      {taxonomyErrorMessage !== null ? (
        <p className="mt-1 text-xs text-amber-600/90">{taxonomyErrorMessage}</p>
      ) : null}

      {showDropdown ? (
        <ul
          className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-700 bg-gray-900 py-1 shadow-lg ring-1 ring-black/40"
          role="listbox"
          aria-label="Tag suggestions"
          onMouseDown={(ev) => ev.preventDefault()}
        >
          {filteredSuggestions.map((s) => (
            <li key={s} role="option">
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left font-mono text-xs text-teal-400 hover:bg-gray-800"
                onClick={() => addSlug(s)}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
