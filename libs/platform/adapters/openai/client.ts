import 'dotenv/config';

import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { z } from 'zod';

import type { Result } from '@shared/result';
import { ok, err } from '@shared/result';

import type {
  ChatMessage,
  CompletionConfig,
  StructuredCompletionResult,
  OpenAIAdapterError,
} from './types';

function requireOpenAiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (key === undefined || key === '') {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it to a .env file at the repo root.',
    );
  }
  return key;
}

const client = new OpenAI({ apiKey: requireOpenAiKey() });

export async function structuredCompletion<T>(
  messages: readonly ChatMessage[],
  schema: z.ZodType<T>,
  schemaName: string,
  config: CompletionConfig,
): Promise<Result<StructuredCompletionResult<T>, OpenAIAdapterError>> {
  try {
    const response = await client.responses.parse({
      model: config.model,
      input: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: config.temperature,
      max_output_tokens: config.maxTokens,
      text: {
        format: zodTextFormat(schema, schemaName),
      },
    });

    if (response.output_parsed === null) {
      const refusal = response.output
        .flatMap(item => item.type === 'message' ? item.content : [])
        .find(content => content.type === 'refusal');

      if (refusal && refusal.type === 'refusal') {
        return err({ kind: 'refusal' as const, refusal: refusal.refusal });
      }

      return err({
        kind: 'empty_response' as const,
        message: 'OpenAI returned no parsed content.',
      });
    }

    return ok({
      parsed: response.output_parsed,
      usage: {
        promptTokens: response.usage?.input_tokens ?? 0,
        completionTokens: response.usage?.output_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
    });
  } catch (error: unknown) {
    if (error instanceof OpenAI.APIError) {
      return err({
        kind: 'api_error' as const,
        message: error.message,
        status: error.status,
      });
    }
    return err({
      kind: 'unexpected' as const,
      message: error instanceof Error ? error.message : 'Unknown error during OpenAI call',
      cause: error,
    });
  }
}
