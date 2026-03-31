import { z } from 'zod';

import { ALL_TAG_IDS } from './tags';

export const TagEntrySchema = z.object({
  tag: z.enum(ALL_TAG_IDS),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
});

export const CardTaggingOutputSchema = z.object({
  tags: z.array(TagEntrySchema),
});

export type CardTaggingOutput = z.infer<typeof CardTaggingOutputSchema>;
