import { ok, err } from '@shared/result';
import type { Result } from '@shared/result';
import type { Keyword } from '@shared/types';
import { KeywordSchema } from '@shared/keyword-schemas';

import { prisma } from '../adapters/prisma/client';

export type KeywordError =
  | { kind: 'not_found'; slug: string }
  | { kind: 'database_error'; message: string }
  | { kind: 'parse_error'; message: string };

export type KeywordInput = {
  readonly name: string;
  readonly slug: string;
  readonly type: string;
  readonly rulesTextTemplate: string;
  readonly parameterized: boolean;
  readonly parameterName: string | undefined;
  readonly mechanicSummary: string;
  readonly defaultTags: readonly string[];
  readonly tagNotes: readonly string[];
  readonly example: string | undefined;
  readonly setScope: readonly string[];
};

export type UpsertKeywordsResult = {
  readonly upserted: number;
};

function toKeyword(row: {
  name: string;
  slug: string;
  type: string;
  rulesTextTemplate: string;
  parameterized: boolean;
  parameterName: string | null;
  mechanicSummary: string | null;
  defaultTags: string[];
  tagNotes: string[];
  example: string | null;
  setScope: string[];
}): Result<Keyword, KeywordError> {
  const base = {
    name: row.name,
    slug: row.slug,
    type: row.type,
    rulesTextTemplate: row.rulesTextTemplate,
    parameterized: row.parameterized,
    mechanicSummary: row.mechanicSummary,
    defaultTags: row.defaultTags,
    tagNotes: row.tagNotes,
    ...(row.example !== null ? { example: row.example } : {}),
    setScope: row.setScope,
  };
  const raw = row.parameterized
    ? { ...base, parameterName: row.parameterName ?? '' }
    : base;

  const parsed = KeywordSchema.safeParse(raw);
  if (!parsed.success) {
    return err({
      kind: 'parse_error' as const,
      message: `Keyword "${row.name}": ${parsed.error.message}`,
    });
  }
  return ok(parsed.data);
}

export async function upsertKeywords(
  keywords: readonly KeywordInput[],
): Promise<Result<UpsertKeywordsResult, KeywordError>> {
  try {
    const results = await prisma.$transaction(
      keywords.map((kw) => {
        const data = {
          name: kw.name,
          slug: kw.slug,
          type: kw.type,
          rulesTextTemplate: kw.rulesTextTemplate,
          parameterized: kw.parameterized,
          parameterName: kw.parameterName ?? null,
          mechanicSummary: kw.mechanicSummary,
          defaultTags: [...kw.defaultTags],
          tagNotes: [...kw.tagNotes],
          example: kw.example ?? null,
          setScope: [...kw.setScope],
        };

        return prisma.keyword.upsert({
          where: { slug: kw.slug },
          update: data,
          create: data,
        });
      }),
    );

    return ok({ upserted: results.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error' as const, message });
  }
}

export async function findKeywordBySlug(
  slug: string,
): Promise<Result<Keyword, KeywordError>> {
  try {
    const row = await prisma.keyword.findUnique({ where: { slug } });
    if (row === null) {
      return err({ kind: 'not_found' as const, slug });
    }
    return toKeyword(row);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error' as const, message });
  }
}

export async function findAllKeywords(): Promise<
  Result<Keyword[], KeywordError>
> {
  try {
    const rows = await prisma.keyword.findMany({ orderBy: { name: 'asc' } });
    const keywords: Keyword[] = [];
    for (const row of rows) {
      const result = toKeyword(row);
      if (!result.ok) return result;
      keywords.push(result.value);
    }
    return ok(keywords);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return err({ kind: 'database_error' as const, message });
  }
}
