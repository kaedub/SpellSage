import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  CardSearchFilter,
  ColorFilter,
  NumericRange,
} from '@shared/search';

import { useDebouncedValue } from '../lib/use-debounced-value';
import { ColorPicker } from './color-picker';
import { FilterSection } from './filter-section';
import { NumericRangeInput } from './numeric-range-input';

const DEBOUNCE_MS = 300;

const CARD_TYPES = [
  'Artifact',
  'Battle',
  'Creature',
  'Enchantment',
  'Instant',
  'Land',
  'Planeswalker',
  'Sorcery',
] as const;

const EXTRA_CARD_TYPES = [
  'Conspiracy',
  'Dungeon',
  'Host',
  'Kindred',
  'Phenomenon',
  'Plane',
  'Scheme',
  'Tribal',
  'Vanguard',
] as const;

export type TagFilterUrlSeed = {
  readonly slugs: readonly string[];
  readonly mode: 'all' | 'any' | 'none';
};

type FilterPanelProps = {
  readonly onFilterChange: (filter: CardSearchFilter) => void;
  readonly collectionUserId?: string;
  /** When present (e.g. from `/search?tag=…`), seeds tag filter text and mode. */
  readonly tagFilterFromUrl?: TagFilterUrlSeed;
};

type FilterState = {
  nameText: string;
  colors: ColorFilter | undefined;
  colorIdentity: ColorFilter | undefined;
  selectedTypes: string[];
  showExtraTypes: boolean;
  subtypesText: string;
  cmcRange: NumericRange | undefined;
  powerRange: NumericRange | undefined;
  toughnessRange: NumericRange | undefined;
  keywordsText: string;
  oracleText: string;
  isLegendary: 'any' | 'yes' | 'no';
  producedMana: string[];
  tagsText: string;
  tagsMode: 'all' | 'any' | 'none';
  inCollection: boolean;
};

const INITIAL_STATE: FilterState = {
  nameText: '',
  colors: undefined,
  colorIdentity: undefined,
  selectedTypes: [],
  showExtraTypes: false,
  subtypesText: '',
  cmcRange: undefined,
  powerRange: undefined,
  toughnessRange: undefined,
  keywordsText: '',
  oracleText: '',
  isLegendary: 'any',
  producedMana: [],
  tagsText: '',
  tagsMode: 'any',
  inCollection: false,
};

function applyTagUrlSeed(
  base: FilterState,
  seed: TagFilterUrlSeed | undefined,
): FilterState {
  if (seed === undefined || seed.slugs.length === 0) {
    return base;
  }
  return {
    ...base,
    tagsText: seed.slugs.join(', '),
    tagsMode: seed.mode,
  };
}

function tagUrlSeedKey(seed: TagFilterUrlSeed | undefined): string {
  if (seed === undefined || seed.slugs.length === 0) {
    return '';
  }
  return `${[...seed.slugs].sort().join('\0')}:${seed.mode}`;
}

function splitCommaSeparated(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function FilterPanel({
  onFilterChange,
  collectionUserId,
  tagFilterFromUrl,
}: FilterPanelProps) {
  const [state, setState] = useState<FilterState>(() =>
    applyTagUrlSeed(INITIAL_STATE, tagFilterFromUrl),
  );

  const urlSeedKey = tagUrlSeedKey(tagFilterFromUrl);
  const prevUrlSeedKey = useRef(urlSeedKey);

  useEffect(() => {
    if (urlSeedKey === '') {
      prevUrlSeedKey.current = '';
      return;
    }
    if (prevUrlSeedKey.current === urlSeedKey) {
      return;
    }
    prevUrlSeedKey.current = urlSeedKey;
    if (tagFilterFromUrl === undefined || tagFilterFromUrl.slugs.length === 0) {
      return;
    }
    setState((prev) => applyTagUrlSeed(prev, tagFilterFromUrl));
  }, [urlSeedKey, tagFilterFromUrl]);

  const debouncedName = useDebouncedValue(state.nameText, DEBOUNCE_MS);
  const debouncedSubtypes = useDebouncedValue(state.subtypesText, DEBOUNCE_MS);
  const debouncedKeywords = useDebouncedValue(state.keywordsText, DEBOUNCE_MS);
  const debouncedOracle = useDebouncedValue(state.oracleText, DEBOUNCE_MS);
  const debouncedTags = useDebouncedValue(state.tagsText, DEBOUNCE_MS);

  const filter = useMemo((): CardSearchFilter => {
    const f: CardSearchFilter = {};

    if (debouncedName.trim()) f.name = debouncedName.trim();
    if (state.colors) f.colors = state.colors;
    if (state.colorIdentity) f.colorIdentity = state.colorIdentity;
    if (state.selectedTypes.length > 0) f.types = state.selectedTypes;

    const subtypes = splitCommaSeparated(debouncedSubtypes);
    if (subtypes.length > 0) f.subtypes = subtypes;

    if (state.cmcRange) f.cmc = state.cmcRange;
    if (state.powerRange) f.power = state.powerRange;
    if (state.toughnessRange) f.toughness = state.toughnessRange;

    const keywords = splitCommaSeparated(debouncedKeywords);
    if (keywords.length > 0) f.keywords = keywords;

    const oracleTerms = splitCommaSeparated(debouncedOracle);
    if (oracleTerms.length > 0) f.oracleText = oracleTerms;

    if (state.isLegendary === 'yes') f.isLegendary = true;
    if (state.isLegendary === 'no') f.isLegendary = false;

    if (state.producedMana.length > 0)
      f.producedMana = state.producedMana as CardSearchFilter['producedMana'];

    const tags = splitCommaSeparated(debouncedTags);
    if (tags.length > 0) {
      const tagFilter: { all?: string[]; any?: string[]; none?: string[] } = {};
      tagFilter[state.tagsMode] = tags;
      f.tags = tagFilter;
    }

    if (collectionUserId) {
      f.collection = { userId: collectionUserId };
    } else if (state.inCollection) {
      f.collection = { userId: 'seed-user' };
    }

    return f;
  }, [
    debouncedName,
    state.colors,
    state.colorIdentity,
    state.selectedTypes,
    debouncedSubtypes,
    state.cmcRange,
    state.powerRange,
    state.toughnessRange,
    debouncedKeywords,
    debouncedOracle,
    state.isLegendary,
    state.producedMana,
    debouncedTags,
    state.tagsMode,
    collectionUserId,
    state.inCollection,
  ]);

  useEffect(() => {
    onFilterChange(filter);
  }, [filter, onFilterChange]);

  function update<K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function toggleType(type: string) {
    setState((prev) => {
      const next = prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter((t) => t !== type)
        : [...prev.selectedTypes, type];
      return { ...prev, selectedTypes: next };
    });
  }

  function toggleProducedMana(color: string) {
    setState((prev) => {
      const next = prev.producedMana.includes(color)
        ? prev.producedMana.filter((c) => c !== color)
        : [...prev.producedMana, color];
      return { ...prev, producedMana: next };
    });
  }

  function handleReset() {
    setState(INITIAL_STATE);
  }

  const inputClass =
    'w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-500';

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-900">
      {/* Name search */}
      <div className="border-b border-gray-800 p-3">
        <input
          type="text"
          placeholder="Search by name\u2026"
          value={state.nameText}
          onChange={(e) => update('nameText', e.target.value)}
          className={`${inputClass} py-2.5 text-base`}
        />
      </div>

      {/* Filter sections */}
      <FilterSection title="Colors" defaultOpen>
        <ColorPicker
          value={state.colors}
          onChange={(v) => update('colors', v)}
        />
      </FilterSection>

      <FilterSection title="Color Identity">
        <ColorPicker
          value={state.colorIdentity}
          onChange={(v) => update('colorIdentity', v)}
        />
      </FilterSection>

      <FilterSection title="Card Type" defaultOpen>
        <div className="flex flex-wrap gap-1.5">
          {CARD_TYPES.map((type) => {
            const active = state.selectedTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => update('showExtraTypes', !state.showExtraTypes)}
          className="mt-2 text-xs text-gray-500 hover:text-gray-300"
        >
          {state.showExtraTypes ? 'Hide extra types' : 'More types\u2026'}
        </button>
        {state.showExtraTypes && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {EXTRA_CARD_TYPES.map((type) => {
              const active = state.selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        )}
      </FilterSection>

      <FilterSection title="Subtypes">
        <input
          type="text"
          placeholder="e.g. Elf, Wizard"
          value={state.subtypesText}
          onChange={(e) => update('subtypesText', e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-600">Comma-separated, must have all</p>
      </FilterSection>

      <FilterSection title="Mana Value (CMC)" defaultOpen>
        <NumericRangeInput
          label=""
          value={state.cmcRange}
          onChange={(v) => update('cmcRange', v)}
        />
      </FilterSection>

      <FilterSection title="Power">
        <NumericRangeInput
          label=""
          value={state.powerRange}
          onChange={(v) => update('powerRange', v)}
        />
      </FilterSection>

      <FilterSection title="Toughness">
        <NumericRangeInput
          label=""
          value={state.toughnessRange}
          onChange={(v) => update('toughnessRange', v)}
        />
      </FilterSection>

      <FilterSection title="Keywords">
        <input
          type="text"
          placeholder="e.g. Flying, Trample"
          value={state.keywordsText}
          onChange={(e) => update('keywordsText', e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-600">Comma-separated, must have all</p>
      </FilterSection>

      <FilterSection title="Oracle Text">
        <input
          type="text"
          placeholder="e.g. draw a card, destroy"
          value={state.oracleText}
          onChange={(e) => update('oracleText', e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-600">
          Comma-separated terms (all must match)
        </p>
      </FilterSection>

      <FilterSection title="Legendary">
        <div className="flex gap-1.5">
          {(['any', 'yes', 'no'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => update('isLegendary', opt)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                state.isLegendary === opt
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {opt === 'any' ? 'Any' : opt === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Produced Mana">
        <div className="flex gap-1.5">
          {MANA_COLORS.map(({ code, label, activeBg }) => {
            const active = state.producedMana.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleProducedMana(code)}
                title={label}
                className={`h-7 w-7 rounded-full text-xs font-bold transition-all ${
                  active
                    ? `${activeBg} text-white ring-2 ring-indigo-400 ring-offset-1 ring-offset-gray-900`
                    : 'bg-gray-700 text-gray-400 opacity-60 hover:opacity-90'
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Tags">
        <input
          type="text"
          placeholder="e.g. removal, ramp"
          value={state.tagsText}
          onChange={(e) => update('tagsText', e.target.value)}
          className={inputClass}
        />
        <div className="mt-2 flex gap-1.5">
          {(['all', 'any', 'none'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => update('tagsMode', mode)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                state.tagsMode === mode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {mode === 'all' ? 'Has all' : mode === 'any' ? 'Has any' : 'Has none'}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* "In My Collection" toggle -- only on search page */}
      {!collectionUserId && (
        <FilterSection title="Collection">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={state.inCollection}
              onChange={(e) => update('inCollection', e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-300">In my collection only</span>
          </label>
        </FilterSection>
      )}

      {/* Reset button */}
      <div className="mt-auto border-t border-gray-800 p-3">
        <button
          type="button"
          onClick={handleReset}
          className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}

const MANA_COLORS = [
  { code: 'W', label: 'White', activeBg: 'bg-amber-400' },
  { code: 'U', label: 'Blue', activeBg: 'bg-blue-500' },
  { code: 'B', label: 'Black', activeBg: 'bg-purple-600' },
  { code: 'R', label: 'Red', activeBg: 'bg-red-500' },
  { code: 'G', label: 'Green', activeBg: 'bg-green-600' },
  { code: 'C', label: 'Colorless', activeBg: 'bg-gray-500' },
] as const;
