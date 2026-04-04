import type { TokenUsage, OpenAIAdapterError } from '../../adapters/openai/types';

export type CardFaceInput = {
  readonly name: string;
  readonly typeLine: string;
  readonly oracleText: string;
  // TODO: also should have power and toughness
};

export type CardTagInput = {
  readonly name: string;
  readonly manaCost: string | undefined;
  readonly cmc: number | undefined;
  readonly typeLine: string;
  readonly oracleText: string;
  readonly colors: readonly string[];
  readonly keywords: readonly string[];
  readonly subtypes: readonly string[];
  readonly types: readonly string[];
  readonly power: string | null;
  readonly toughness: string | null;
  readonly producedMana: readonly string[];
  readonly faces: readonly CardFaceInput[] | null;
};

export type TagEntry = {
  readonly tag: string;
  readonly confidence: number;
  readonly evidence: string;
};

export type SkippedTagReason =
  | 'below_confidence_threshold'
  | 'exceeded_max_tags';

export type SkippedTagEntry = {
  readonly tag: string;
  readonly confidence: number;
  readonly evidence: string;
  readonly reason: SkippedTagReason;
};

export type CardTagResult = {
  readonly cardId: string;
  readonly cardName: string;
  readonly tags: readonly TagEntry[];
  readonly skippedTags: readonly SkippedTagEntry[];
  readonly usage: TokenUsage;
};

export type CardTaggingError =
  | OpenAIAdapterError
  | { readonly kind: 'no_taggable_text'; readonly cardName: string };

export type TaggingConfig = {
  readonly model: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly confidenceThreshold?: number;
};

export const DEFAULT_TAGGING_CONFIG: Required<TaggingConfig> = {
  model: 'gpt-4o-mini',
  temperature: 0.2,
  maxTokens: 1024,
  confidenceThreshold: 0.5,
};
