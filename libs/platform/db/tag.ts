import { ok, err } from '@shared/result';
import type { Result } from '@shared/result';

import { prisma } from '../adapters/prisma/client';

// --- Error type ---

export type TagError =
  | { kind: 'not_found'; slug: string }
  | { kind: 'database_error'; message: string };

// --- Input types for seeding ---

export type TagInput = {
  readonly slug: string;
  readonly groupSlug: string;
  readonly definition: string;
  readonly mustHave: readonly string[];
  readonly mustNotHave: readonly string[];
  readonly edgeRule: string | undefined;
  readonly priority: string | undefined;
};

export type TagGroupInput = {
  readonly slug: string;
  readonly description: string | undefined;
};

export type UpsertTagTaxonomyResult = {
  readonly groups: number;
  readonly tags: number;
};

// --- Taxonomy type returned for AI service consumption ---

export type TagTaxonomyEntry = {
  readonly slug: string;
  readonly definition: string;
  readonly mustHave: readonly string[];
  readonly mustNotHave: readonly string[];
  readonly edgeRule: string | null;
  readonly priority: string | null;
};

export type TagTaxonomyGroup = {
  readonly slug: string;
  readonly description: string | null;
  readonly tags: readonly TagTaxonomyEntry[];
};

export type TagTaxonomy = {
  readonly groups: readonly TagTaxonomyGroup[];
  readonly allSlugs: readonly string[];
};

// --- Upsert taxonomy (for seeding) ---

export async function upsertTagTaxonomy(
  groups: readonly TagGroupInput[],
  tags: readonly TagInput[],
): Promise<Result<UpsertTagTaxonomyResult, TagError>> {
  try {
    await prisma.$transaction([
      ...groups.map((g) =>
        prisma.tagGroup.upsert({
          where: { slug: g.slug },
          update: { description: g.description ?? null },
          create: { slug: g.slug, description: g.description ?? null },
        }),
      ),
      ...tags.map((t) => {
        const data = {
          groupSlug: t.groupSlug,
          definition: t.definition,
          mustHave: [...t.mustHave],
          mustNotHave: [...t.mustNotHave],
          edgeRule: t.edgeRule ?? null,
          priority: t.priority ?? null,
        };
        return prisma.tag.upsert({
          where: { slug: t.slug },
          update: data,
          create: { slug: t.slug, ...data },
        });
      }),
    ]);

    return ok({ groups: groups.length, tags: tags.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error' as const, message });
  }
}

// --- Load full taxonomy (for AI service) ---

export async function loadTagTaxonomy(): Promise<Result<TagTaxonomy, TagError>> {
  try {
    const groups = await prisma.tagGroup.findMany({
      orderBy: { slug: 'asc' },
      include: {
        tags: {
          orderBy: { slug: 'asc' },
        },
      },
    });

    const allSlugs: string[] = [];
    const taxonomyGroups: TagTaxonomyGroup[] = groups.map((g) => ({
      slug: g.slug,
      description: g.description,
      tags: g.tags.map((t) => {
        allSlugs.push(t.slug);
        return {
          slug: t.slug,
          definition: t.definition,
          mustHave: t.mustHave,
          mustNotHave: t.mustNotHave,
          edgeRule: t.edgeRule,
          priority: t.priority,
        };
      }),
    }));

    return ok({ groups: taxonomyGroups, allSlugs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error' as const, message });
  }
}
