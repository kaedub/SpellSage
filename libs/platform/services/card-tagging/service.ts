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

import { createCardTaggingOutputSchema } from './schemas';
import type { CardTaggingOutput } from './schemas';
import { projectCardForTagging, buildTaggingMessages } from './prompts';
import type { TagPromptGroup } from './prompts';
import type {
  CardTagResult,
  CardTaggingError,
  SkippedTagEntry,
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

export type TagTaxonomyDep = {
  readonly groups: readonly TagPromptGroup[];
  readonly allSlugs: readonly string[];
};

export type CardTaggingService = {
  tagCard(card: Card): Promise<Result<CardTagResult, CardTaggingError>>;
};

export function createCardTaggingService(deps: {
  completion: StructuredCompletionFn;
  taxonomy: TagTaxonomyDep;
  config?: Partial<TaggingConfig>;
}): CardTaggingService {
  const config: Required<TaggingConfig> = {
    ...DEFAULT_TAGGING_CONFIG,
    ...deps.config,
  };

  const slugs = deps.taxonomy.allSlugs as unknown as [string, ...string[]];
  const outputSchema = createCardTaggingOutputSchema(slugs);

  return { tagCard };

  async function tagCard(
    card: Card,
  ): Promise<Result<CardTagResult, CardTaggingError>> {
    if (!hasTaggableText(card)) {
      return err({ kind: 'no_taggable_text' as const, cardName: card.name });
    }

    const input = projectCardForTagging(card);
    const messages = buildTaggingMessages(input, deps.taxonomy.groups);

    const completionResult = await deps.completion(
      messages,
      outputSchema,
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
    const { tags, skippedTags } = postProcess(parsed, config.confidenceThreshold);

    return ok({
      cardId: card.id,
      cardName: card.name,
      tags,
      skippedTags,
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
): { readonly tags: readonly TagEntry[]; readonly skippedTags: readonly SkippedTagEntry[] } {
  const sorted = [...output.tags].sort((a, b) => b.confidence - a.confidence);
  const skippedTags: SkippedTagEntry[] = [];

  for (const t of sorted.slice(MAX_RETURNED_TAGS)) {
    skippedTags.push({
      tag: t.tag,
      confidence: t.confidence,
      evidence: t.evidence,
      reason: 'exceeded_max_tags',
    });
  }

  const tags: TagEntry[] = [];
  for (const t of sorted.slice(0, MAX_RETURNED_TAGS)) {
    if (t.confidence >= confidenceThreshold) {
      tags.push(t);
    } else {
      skippedTags.push({
        tag: t.tag,
        confidence: t.confidence,
        evidence: t.evidence,
        reason: 'below_confidence_threshold',
      });
    }
  }

  return { tags, skippedTags };
}
