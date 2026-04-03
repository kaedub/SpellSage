export { structuredCompletion } from './adapters/openai/client';
export type {
  ChatRole,
  ChatMessage,
  CompletionConfig,
  StructuredCompletionResult,
  TokenUsage,
  OpenAIAdapterError,
} from './adapters/openai/types';

export { createCardTaggingService } from './services/card-tagging';
export type {
  CardTaggingService,
  TagTaxonomyDep,
  CardTagResult,
  CardTaggingError,
  TagEntry,
  TaggingConfig,
  CardTagInput,
  TagPromptGroup,
  TagPromptEntry,
} from './services/card-tagging';
