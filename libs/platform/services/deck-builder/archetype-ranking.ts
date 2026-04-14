import { getCollectionTagAggregates } from '../../db/collection-tags';
import { ARCHETYPES } from './constants/archetypes';

/** Support tag hits are weighted lower than core tags so ordering stays engine-forward, not noise-forward. */
export const SUPPORT_WEIGHT = 0.5;
/** Anti tags subtract modestly so a few overlapping pieces do not erase an otherwise coherent shell. */
export const ANTI_PENALTY = 0.25;

export type ArchetypeRow = (typeof ARCHETYPES.archetypes)[number];

export type ScoreBreakdown = {
  readonly core: number;
  readonly support: number;
  readonly anti: number;
  readonly total: number;
};

export type ScoredArchetype = {
  readonly archetype: ArchetypeRow;
  readonly score: ScoreBreakdown;
};

function buildSignalMap(
  aggregates: readonly { readonly tagSlug: string; readonly distinctCards: number }[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of aggregates) {
    map.set(row.tagSlug, row.distinctCards);
  }
  return map;
}

function sumSignal(slugs: readonly string[], signal: ReadonlyMap<string, number>): number {
  let total = 0;
  for (const slug of slugs) {
    total += signal.get(slug) ?? 0;
  }
  return total;
}

function scoreArchetype(archetype: ArchetypeRow, signal: ReadonlyMap<string, number>): ScoreBreakdown {
  const core = sumSignal(archetype.core_tags, signal);
  const support = sumSignal(archetype.support_tags, signal);
  const anti = sumSignal(archetype.anti_tags, signal);
  const total = core + SUPPORT_WEIGHT * support - ANTI_PENALTY * anti;
  return { core, support, anti, total };
}

/**
 * Scores every archetype by tag fit against the given collection and returns them sorted
 * highest to lowest.
 */
export async function scoreArchetypesForCollection(collectionId: number): Promise<ScoredArchetype[]> {
  const aggregatesResult = await getCollectionTagAggregates(collectionId);
  if (!aggregatesResult.ok) {
    throw new Error(`Failed to load collection tag aggregates: ${aggregatesResult.error.message}`);
  }

  const signal = buildSignalMap(aggregatesResult.value);

  return ARCHETYPES.archetypes
    .map((archetype) => ({ archetype, score: scoreArchetype(archetype, signal) }))
    .sort((a, b) => b.score.total - a.score.total).slice(0, 10);
}
