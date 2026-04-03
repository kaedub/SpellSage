import type { ColorFilter, ColorFilterMode } from '@shared/search';

type ColorCode = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';

type ColorPickerProps = {
  readonly value: ColorFilter | undefined;
  readonly onChange: (value: ColorFilter | undefined) => void;
  readonly showMode?: boolean;
};

const COLORS: ReadonlyArray<{
  code: ColorCode;
  label: string;
  bg: string;
  activeBg: string;
  text: string;
}> = [
  { code: 'W', label: 'White', bg: 'bg-amber-200', activeBg: 'bg-amber-400', text: 'text-gray-900' },
  { code: 'U', label: 'Blue', bg: 'bg-blue-300', activeBg: 'bg-blue-500', text: 'text-white' },
  { code: 'B', label: 'Black', bg: 'bg-purple-300', activeBg: 'bg-purple-600', text: 'text-white' },
  { code: 'R', label: 'Red', bg: 'bg-red-300', activeBg: 'bg-red-500', text: 'text-white' },
  { code: 'G', label: 'Green', bg: 'bg-green-300', activeBg: 'bg-green-600', text: 'text-white' },
  { code: 'C', label: 'Colorless', bg: 'bg-gray-400', activeBg: 'bg-gray-500', text: 'text-white' },
];

const MODES: { value: ColorFilterMode; label: string }[] = [
  { value: 'exact', label: 'Exactly' },
  { value: 'includes', label: 'Including' },
];

export function ColorPicker({ value, onChange, showMode = true }: ColorPickerProps) {
  const selected = value?.values ?? [];
  const mode = value?.mode ?? 'includes';

  function toggleColor(code: ColorCode) {
    const isSelected = selected.includes(code);
    const next: ColorCode[] = isSelected
      ? selected.filter((c): c is ColorCode => c !== code)
      : [...selected, code];

    if (next.length === 0) {
      onChange(undefined);
    } else {
      onChange({ mode, values: next });
    }
  }

  function setMode(nextMode: ColorFilterMode) {
    if (!value || value.values.length === 0) return;
    onChange({ ...value, mode: nextMode });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {COLORS.map(({ code, label, bg, activeBg, text }) => {
          const isActive = selected.includes(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggleColor(code)}
              title={label}
              className={`h-7 w-7 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? `${activeBg} ${text} ring-2 ring-indigo-400 ring-offset-1 ring-offset-gray-900`
                  : `${bg} text-gray-700 opacity-40 hover:opacity-70`
              }`}
            >
              {code}
            </button>
          );
        })}
      </div>

      {showMode && selected.length > 0 && (
        <div className="flex gap-1">
          {MODES.map(({ value: m, label }) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded px-2 py-0.5 text-xs transition-colors ${
                mode === m
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
