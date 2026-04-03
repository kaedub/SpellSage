type NumericRangeValue = {
  readonly gte?: number;
  readonly lte?: number;
};

type NumericRangeInputProps = {
  readonly label: string;
  readonly value: NumericRangeValue | undefined;
  readonly onChange: (value: NumericRangeValue | undefined) => void;
};

function parseIntOrUndefined(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? undefined : n;
}

export function NumericRangeInput({
  label,
  value,
  onChange,
}: NumericRangeInputProps) {
  function update(field: 'gte' | 'lte', raw: string) {
    const parsed = parseIntOrUndefined(raw);
    const next = { ...value, [field]: parsed };
    if (next.gte === undefined && next.lte === undefined) {
      onChange(undefined);
    } else {
      onChange(next);
    }
  }

  return (
    <div className="space-y-1">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={value?.gte ?? ''}
          onChange={(e) => update('gte', e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-500"
        />
        <span className="text-gray-600">&ndash;</span>
        <input
          type="number"
          placeholder="Max"
          value={value?.lte ?? ''}
          onChange={(e) => update('lte', e.target.value)}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-500"
        />
      </div>
    </div>
  );
}
