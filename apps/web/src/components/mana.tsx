import type { ReactNode } from 'react';

/**
 * Coordinate map for the SlightlyMagic Mana.svg sprite sheet.
 * Each entry maps a mana symbol key to [cx, cy] — the center of
 * that symbol's circle in the SVG coordinate space.
 *
 * SVG viewBox: "-945 -210.002 1045 730.002"
 * Each symbol occupies a 100×100 area (radius-50 circles).
 */
const SYMBOL_COORDS: Readonly<Record<string, readonly [number, number]>> = {
  // Generic 0-9 (row y = -160)
  '0': [-895, -160],
  '1': [-790, -160],
  '2': [-685, -160],
  '3': [-580, -160],
  '4': [-475, -160],
  '5': [-370, -160],
  '6': [-265, -160],
  '7': [-160, -160],
  '8': [-55, -160],
  '9': [50, -160],

  // Generic 10-19 (row y = -55)
  '10': [-895, -55],
  '11': [-790, -55],
  '12': [-685, -55],
  '13': [-580, -55],
  '14': [-475, -55],
  '15': [-370, -55],
  '16': [-265, -55],
  '17': [-160, -55],
  '18': [-55, -55],
  '19': [50, -55],

  // 20, X, W, U, B, R, G (row y = 50)
  '20': [-895, 50],
  X: [-790, 50],
  W: [-475, 50],
  U: [-370, 50],
  B: [-265, 50],
  R: [-160, 50],
  G: [-55, 50],

  // Snow mana (star/snowflake at cx=50, cy=50)
  S: [50, 50],

  // Tap / Untap (row y ≈ 365)
  T: [-475, 365],
  Q: [-370, 365],

  // Hybrid color pairs (row y = 155)
  'W/U': [-895, 155],
  'W/B': [-790, 155],
  'U/B': [-685, 155],
  'U/R': [-580, 155],
  'B/R': [-475, 155],
  'B/G': [-370, 155],
  'R/W': [-265, 155],
  'R/G': [-160, 155],
  'G/W': [-55, 155],
  'G/U': [50, 155],
};

const SVG_ORIGIN_X = -945;
const SVG_ORIGIN_Y = -210.002;
const SVG_WIDTH = 1045;
const SVG_HEIGHT = 730.002;
const SYMBOL_RADIUS = 50;

const SIZE_PX: Readonly<Record<ManaSize, number>> = {
  sm: 16,
  md: 20,
  lg: 28,
};

type ManaSize = 'sm' | 'md' | 'lg';

type ManaSymbolProps = {
  readonly symbol: string;
  readonly size?: ManaSize;
};

export function ManaSymbol({ symbol, size = 'md' }: ManaSymbolProps) {
  const coords = SYMBOL_COORDS[symbol];
  if (!coords) {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-gray-700 px-1 text-[0.65em] font-bold leading-none text-gray-300">
        {symbol}
      </span>
    );
  }

  const [cx, cy] = coords;
  const px = SIZE_PX[size];
  const vb = `${cx - SYMBOL_RADIUS} ${cy - SYMBOL_RADIUS} ${SYMBOL_RADIUS * 2} ${SYMBOL_RADIUS * 2}`;

  return (
    <svg
      width={px}
      height={px}
      viewBox={vb}
      aria-label={`{${symbol}}`}
      role="img"
      className="inline-block shrink-0"
    >
      <image
        href="/Mana.svg"
        x={SVG_ORIGIN_X}
        y={SVG_ORIGIN_Y}
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
      />
    </svg>
  );
}

const MANA_SYMBOL_RE = /\{([^}]+)\}/g;

type ManaCostProps = {
  readonly cost: string;
  readonly size?: ManaSize;
};

export function ManaCost({ cost, size = 'md' }: ManaCostProps) {
  const symbols = [...cost.matchAll(MANA_SYMBOL_RE)].map((m) => m[1]);
  return (
    <span className="inline-flex items-center gap-0.5">
      {symbols.map((sym, i) => (
        <ManaSymbol key={`${sym}-${i}`} symbol={sym} size={size} />
      ))}
    </span>
  );
}

type ManaTextProps = {
  readonly text: string;
};

/**
 * Renders oracle text with inline mana symbols ({T}, {W}, etc.)
 * and preserves paragraph breaks.
 */
export function ManaText({ text }: ManaTextProps) {
  const paragraphs = text.split('\n');

  return (
    <>
      {paragraphs.map((para, pi) => (
        <p key={pi} className={pi > 0 ? 'mt-2' : undefined}>
          {renderInlineSymbols(para)}
        </p>
      ))}
    </>
  );
}

function renderInlineSymbols(line: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  const re = /\{([^}]+)\}/g;
  let match = re.exec(line);

  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    parts.push(
      <ManaSymbol key={match.index} symbol={match[1]} size="sm" />,
    );
    lastIndex = match.index + match[0].length;
    match = re.exec(line);
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts;
}
