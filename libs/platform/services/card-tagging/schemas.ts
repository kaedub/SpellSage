import { z } from 'zod';

const TagEntrySchema = z.object({
  tag: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
});

const BaseCardTaggingOutputSchema = z.object({
  tags: z.array(TagEntrySchema),
});

export type CardTaggingOutput = z.infer<typeof BaseCardTaggingOutputSchema>;

export function createCardTaggingOutputSchema(
  slugs: readonly [string, ...string[]],
): z.ZodType<CardTaggingOutput> {
  const constrained = z.object({
    tags: z.array(
      z.object({
        tag: z.enum(slugs),
        confidence: z.number().min(0).max(1),
        evidence: z.string(),
      }),
    ),
  });
  return constrained;
}
