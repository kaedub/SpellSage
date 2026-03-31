export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  readonly role: ChatRole;
  readonly content: string;
};

export type CompletionConfig = {
  readonly model: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
};

export type TokenUsage = {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
};

export type StructuredCompletionResult<T> = {
  readonly parsed: T;
  readonly usage: TokenUsage;
};

export type OpenAIAdapterError =
  | { readonly kind: 'api_error'; readonly message: string; readonly status?: number }
  | { readonly kind: 'parse_error'; readonly message: string }
  | { readonly kind: 'refusal'; readonly refusal: string }
  | { readonly kind: 'empty_response'; readonly message: string }
  | { readonly kind: 'unexpected'; readonly message: string; readonly cause?: unknown };
