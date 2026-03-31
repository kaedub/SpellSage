import type { z } from 'zod';

import type { Result } from '@shared/result';
import { ok, err } from '@shared/result';
import type { Card } from '@shared/types';
import type {
  ChatMessage,
  CompletionConfig,
  StructuredCompletionResult,
  OpenAIAdapterError,
} from '../../adapters/openai/types';

import { CardTaggingOutputSchema } from './schemas';
import type { CardTaggingOutput } from './schemas';
import { projectCardForTagging, buildTaggingMessages } from './prompts';
import type {
  CardTagResult,
  CardTaggingError,
  TaggingConfig,
  TagEntry,
} from './types';
import { DEFAULT_TAGGING_CONFIG } from './types';

const MAX_RETURNED_TAGS = 10;

type StructuredCompletionFn = <T>(
  messages: readonly ChatMessage[],
  schema: z.ZodType<T>,
  schemaName: string,
  config: CompletionConfig,
) => Promise<Result<StructuredCompletionResult<T>, OpenAIAdapterError>>;

export type CardTaggingService = {
  tagCard(card: Card): Promise<Result<CardTagResult, CardTaggingError>>;
};

export function createCardTaggingService(deps: {
  completion: StructuredCompletionFn;
  config?: Partial<TaggingConfig>;
}): CardTaggingService {
  const config: Required<TaggingConfig> = {
    ...DEFAULT_TAGGING_CONFIG,
    ...deps.config,
  };

  return { tagCard };

  async function tagCard(
    card: Card,
  ): Promise<Result<CardTagResult, CardTaggingError>> {
    if (!hasTaggableText(card)) {
      return err({ kind: 'no_taggable_text' as const, cardName: card.name });
    }

    const input = projectCardForTagging(card);
    const messages = buildTaggingMessages(input);

    const completionResult = await deps.completion(
      messages,
      CardTaggingOutputSchema,
      'card_tags',
      {
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      },
    );

    if (!completionResult.ok) {
      return completionResult;
    }

    const { parsed, usage } = completionResult.value;
    const tags = postProcess(parsed, config.confidenceThreshold);

    return ok({
      cardId: card.id,
      cardName: card.name,
      tags,
      usage,
    });
  }
}

function hasTaggableText(card: Card): boolean {
  if (card.oracleText !== undefined && card.oracleText.length > 0) {
    return true;
  }
  if (card.faces !== null) {
    return card.faces.some(f => f.oracleText !== undefined && f.oracleText.length > 0);
  }
  return false;
}

function postProcess(
  output: CardTaggingOutput,
  confidenceThreshold: number,
): readonly TagEntry[] {
  return output.tags
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_RETURNED_TAGS)
    .filter(t => t.confidence >= confidenceThreshold);
}
