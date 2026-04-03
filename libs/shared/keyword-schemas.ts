import { z } from 'zod';

export const KEYWORD_TYPES = ['keyword_ability', 'keyword_action'] as const;

export const KeywordTypeSchema = z.enum(KEYWORD_TYPES);

const KeywordBaseSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  type: KeywordTypeSchema,
  rulesTextTemplate: z.string().min(1),
  mechanicSummary: z.string().min(1),
  defaultTags: z.array(z.string()),
  tagNotes: z.array(z.string()),
  example: z.string().min(1).optional(),
  setScope: z.array(z.string()),
});

const NonParameterizedKeywordSchema = KeywordBaseSchema.extend({
  parameterized: z.literal(false),
});

const ParameterizedKeywordSchema = KeywordBaseSchema.extend({
  parameterized: z.literal(true),
  parameterName: z.string().min(1),
});

export const KeywordSchema = z.discriminatedUnion('parameterized', [
  NonParameterizedKeywordSchema,
  ParameterizedKeywordSchema,
]);
