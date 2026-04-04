import { z } from 'zod';

export const TagTaxonomyEntrySchema = z.object({
  slug: z.string(),
  definition: z.string(),
  mustHave: z.array(z.string()),
  mustNotHave: z.array(z.string()),
  edgeRule: z.string().nullable(),
  priority: z.string().nullable(),
});

export const TagTaxonomyGroupSchema = z.object({
  slug: z.string(),
  description: z.string().nullable(),
  tags: z.array(TagTaxonomyEntrySchema),
});

export const TagTaxonomySchema = z.object({
  groups: z.array(TagTaxonomyGroupSchema),
  allSlugs: z.array(z.string()),
});

export type TagTaxonomyEntry = z.infer<typeof TagTaxonomyEntrySchema>;
export type TagTaxonomyGroup = z.infer<typeof TagTaxonomyGroupSchema>;
export type TagTaxonomy = z.infer<typeof TagTaxonomySchema>;
