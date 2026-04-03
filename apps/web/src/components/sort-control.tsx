import type { Sort, SortableField } from '@shared/search';

type SortControlProps = {
  readonly value: Sort;
  readonly onChange: (sort: Sort) => void;
};

const FIELD_LABELS: Record<SortableField, string> = {
  name: 'Name',
  cmc: 'Mana Value',
  numericPower: 'Power',
  numericToughness: 'Toughness',
};

const SORT_FIELDS: SortableField[] = [
  'name',
  'cmc',
  'numericPower',
  'numericToughness',
];

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-400" htmlFor="sort-field">
        Sort:
      </label>

      <select
        id="sort-field"
        value={value.field}
        onChange={(e) =>
          onChange({ ...value, field: e.target.value as SortableField })
        }
        className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-indigo-500"
      >
        {SORT_FIELDS.map((field) => (
          <option key={field} value={field}>
            {FIELD_LABELS[field]}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() =>
          onChange({
            ...value,
            direction: value.direction === 'asc' ? 'desc' : 'asc',
          })
        }
        className="rounded-md bg-gray-800 px-2 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700"
        title={value.direction === 'asc' ? 'Ascending' : 'Descending'}
      >
        {value.direction === 'asc' ? '\u2191 Asc' : '\u2193 Desc'}
      </button>
    </div>
  );
}
