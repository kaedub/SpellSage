import 'dotenv/config';

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { toSlug } from '@shared/slug';
import { upsertKeywords, findAllKeywords } from '@platform/db';
import type { KeywordInput } from '@platform/db';

type RawKeyword = {
  type: string;
  rules_text_template: string;
  parameterized: boolean;
  parameter_name?: string;
  mechanic_summary: string;
  default_tags?: string[];
  tag_notes?: string[];
  example?: string;
  set_scope?: string[];
};

type RawKeywordsFile = {
  abilities: Record<string, RawKeyword>;
};

function loadKeywordsFile(path: string): KeywordInput[] {
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as RawKeywordsFile;
  const entries = Object.entries(raw.abilities);

  return entries.map(([name, kw]): KeywordInput => ({
    name,
    slug: toSlug(name),
    type: kw.type,
    rulesTextTemplate: kw.rules_text_template,
    parameterized: kw.parameterized,
    parameterName: kw.parameterized ? (kw.parameter_name ?? 'N') : undefined,
    mechanicSummary: kw.mechanic_summary,
    defaultTags: kw.default_tags ?? [],
    tagNotes: kw.tag_notes ?? [],
    example: kw.example,
    setScope: kw.set_scope ?? [],
  }));
}

async function main(): Promise<void> {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  const fileNames = ['keywords-1.json', 'keywords-2.json', 'keywords-3.json'];
  const keywords = fileNames.flatMap((name) => {
    const filePath = resolve(thisDir, name);
    const kws = loadKeywordsFile(filePath);
    console.log(`  ${name}: ${kws.length} keywords`);
    return kws;
  });

  console.log(`Loaded ${keywords.length} keywords total`);

  const result = await upsertKeywords(keywords);

  if (!result.ok) {
    console.error(`ERROR [${result.error.kind}]:`, result.error);
    process.exit(1);
  }

  console.log(`Upserted ${result.value.upserted} keywords`);

  const allResult = await findAllKeywords();
  if (!allResult.ok) {
    console.error(`Verification failed [${allResult.error.kind}]:`, allResult.error);
    process.exit(1);
  }

  console.log(`Verified ${allResult.value.length} keywords in database`);

  for (const kw of allResult.value.slice(0, 5)) {
    const param = kw.parameterized ? ` (param: ${kw.parameterName})` : '';
    console.log(`  ${kw.slug.padEnd(25)} ${kw.type}${param}`);
  }

  if (allResult.value.length > 5) {
    console.log(`  ... and ${allResult.value.length - 5} more`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
