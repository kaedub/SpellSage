import type { CardSummary, CardTagSummary } from '@shared/search';

import type { CollectionCardMeta } from '../lib/use-collection';
import { ManaCost, ManaSymbol, ManaText } from './mana';
import { Modal } from './modal';

type CardDetailModalProps = {
  readonly card: CardSummary;
  readonly collectionMeta?: CollectionCardMeta;
  readonly onClose: () => void;
};

function ColorSymbols({ codes }: { readonly codes: string[] }) {
  if (codes.length === 0) {
    return <ManaSymbol symbol="C" size="sm" />;
  }
  return (
    <span className="inline-flex items-center gap-0.5">
      {codes.map((c) => (
        <ManaSymbol key={c} symbol={c} size="sm" />
      ))}
    </span>
  );
}

export function CardDetailModal({
  card,
  collectionMeta,
  onClose,
}: CardDetailModalProps) {
  return (
    <Modal open onClose={onClose}>
      <div className="flex flex-col md:flex-row">
        {/* Card image */}
        <div className="shrink-0 md:w-80">
          <img
            src={card.imageUri}
            alt={card.name}
            className="h-auto w-full rounded-t-xl object-contain md:rounded-l-xl md:rounded-tr-none"
          />
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
          {/* Close button */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-100">{card.name}</h2>
              {card.manaCost && (
                <div className="mt-1">
                  <ManaCost cost={card.manaCost} size="md" />
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Type line */}
          <p className="text-sm font-medium text-gray-300">{card.typeLine}</p>

          {/* Oracle text */}
          {card.oracleText && (
            <div className="text-sm leading-relaxed text-gray-300">
              <ManaText text={card.oracleText} />
            </div>
          )}

          {/* Power / Toughness */}
          {card.power !== null && card.toughness !== null && (
            <div className="flex items-center gap-2">
              <span className="rounded bg-gray-800 px-2 py-1 text-sm font-bold text-gray-100">
                {card.power} / {card.toughness}
              </span>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {card.cmc !== null && (
              <DetailField label="CMC" value={String(card.cmc)} />
            )}
            <DetailField label="Set" value={card.set.toUpperCase()} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Colors
              </p>
              <div className="mt-0.5">
                <ColorSymbols codes={card.colors} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Color Identity
              </p>
              <div className="mt-0.5">
                <ColorSymbols codes={card.colorIdentity} />
              </div>
            </div>
            {card.isLegendary && (
              <DetailField label="Legendary" value="Yes" />
            )}
          </div>

          {/* Keywords */}
          {card.keywords.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Keywords
              </p>
              <div className="flex flex-wrap gap-1.5">
                {card.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-300"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags -- guard for API responses not yet including tags */}
          {card.tags !== undefined && card.tags.length > 0 && (
            <TagList tags={card.tags} />
          )}

          {/* Collection info */}
          {collectionMeta && (
            <div className="mt-auto border-t border-gray-800 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                In Collection
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  x{collectionMeta.quantity}
                </span>
                {collectionMeta.foil && (
                  <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-xs font-bold text-white">
                    Foil
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function DetailField({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="text-gray-300">{value}</p>
    </div>
  );
}

function groupTagsByGroup(
  tags: readonly CardTagSummary[],
): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const tag of tags) {
    const existing = groups.get(tag.groupSlug);
    if (existing) {
      existing.push(tag.tagSlug);
    } else {
      groups.set(tag.groupSlug, [tag.tagSlug]);
    }
  }
  return groups;
}

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function TagList({ tags }: { readonly tags: readonly CardTagSummary[] }) {
  const grouped = groupTagsByGroup(tags);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Tags
      </p>
      {Array.from(grouped.entries()).map(([group, slugs]) => (
        <div key={group}>
          <p className="mb-1 text-xs font-medium text-gray-400">
            {formatSlug(group)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {slugs.map((slug) => (
              <span
                key={slug}
                className="rounded-full bg-indigo-900/40 px-2.5 py-0.5 text-xs font-medium text-indigo-300 ring-1 ring-indigo-700/50"
              >
                {formatSlug(slug)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
