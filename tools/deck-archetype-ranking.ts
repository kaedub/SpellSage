import { z } from 'zod';

/** Support tag hits are weighted lower than core tags so ordering stays engine-forward, not noise-forward. */
export const SUPPORT_WEIGHT = 0.5;
/** Anti tags subtract modestly so a few overlapping pieces do not erase an otherwise coherent shell. */
export const ANTI_PENALTY = 0.25;

const ArchetypeRowSchema = z.object({
  name: z.string(),
  description: z.string(),
  gameplan: z.string(),
  win_conditions: z.array(z.string()),
  core_tags: z.array(z.string()),
  support_tags: z.array(z.string()),
  anti_tags: z.array(z.string()),
});

const ArchetypesFileSchema = z.object({
  archetypes: z.array(ArchetypeRowSchema),
});

export type ArchetypeRow = z.infer<typeof ArchetypeRowSchema>;
export type ArchetypesFile = z.infer<typeof ArchetypesFileSchema>;

export type ScoredArchetype = {
  readonly archetype: ArchetypeRow;
  readonly core: number;
  readonly support: number;
  readonly anti: number;
  readonly total: number;
  readonly weak: boolean;
};

export function loadArchetypesFile(raw: unknown): ArchetypesFile {
  return ArchetypesFileSchema.parse(raw);
}

/** All tag slugs referenced by archetype definitions (core, support, anti). */
export function collectArchetypeTagSlugs(archetypes: readonly ArchetypeRow[]): Set<string> {
  const out = new Set<string>();
  for (const a of archetypes) {
    for (const s of a.core_tags) out.add(s);
    for (const s of a.support_tags) out.add(s);
    for (const s of a.anti_tags) out.add(s);
  }
  return out;
}

/** Slugs used in archetypes.json that are missing from the DB taxonomy (sorted for stable logs). */
export function archetypeSlugsMissingFromTaxonomy(
  archetypes: readonly ArchetypeRow[],
  taxonomySlugs: ReadonlySet<string>,
): string[] {
  const fromArchetypes = collectArchetypeTagSlugs(archetypes);
  return [...fromArchetypes].filter((s) => !taxonomySlugs.has(s)).sort((a, b) => a.localeCompare(b));
}

function sumSignal(slugs: readonly string[], signal: ReadonlyMap<string, number>): number {
  let s = 0;
  for (const slug of slugs) {
    s += signal.get(slug) ?? 0;
  }
  return s;
}

function scoreArchetypeParts(
  a: ArchetypeRow,
  signal: ReadonlyMap<string, number>,
): { core: number; support: number; anti: number; total: number } {
  const core = sumSignal(a.core_tags, signal);
  const support = sumSignal(a.support_tags, signal);
  const anti = sumSignal(a.anti_tags, signal);
  const total = core + SUPPORT_WEIGHT * support - ANTI_PENALTY * anti;
  return { core, support, anti, total };
}

export function buildSignalMapFromAggregates(
  aggregates: readonly { readonly tagSlug: string; readonly distinctCards: number }[],
): Map<string, number> {
  const signal = new Map<string, number>();
  for (const row of aggregates) {
    signal.set(row.tagSlug, row.distinctCards);
  }
  return signal;
}

export function scoreAndSortArchetypes(
  archetypes: readonly ArchetypeRow[],
  signal: ReadonlyMap<string, number>,
): ScoredArchetype[] {
  const scored: ScoredArchetype[] = archetypes.map((a) => {
    const parts = scoreArchetypeParts(a, signal);
    return {
      archetype: a,
      ...parts,
      weak: parts.core <= 0,
    };
  });
  scored.sort((x, y) => y.total - x.total);
  return scored;
}
