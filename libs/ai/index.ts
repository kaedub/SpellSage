export { structuredCompletion } from './adapters/openai/client';
export type {
  ChatRole,
  ChatMessage,
  CompletionConfig,
  StructuredCompletionResult,
  TokenUsage,
  OpenAIAdapterError,
} from './adapters/openai/types';

export { createCardTaggingService, ALL_TAG_IDS, TAG_REGISTRY, TAG_DESCRIPTIONS } from './services/card-tagging';
export type {
  CardTaggingService,
  CardTagResult,
  CardTaggingError,
  TagEntry,
  TagId,
  TaggingConfig,
  CardTagInput,
} from './services/card-tagging';
