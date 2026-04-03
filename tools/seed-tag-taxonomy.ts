import 'dotenv/config';

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { upsertTagTaxonomy, loadTagTaxonomy } from '@platform/db';
import type { TagGroupInput, TagInput } from '@platform/db';

type RawTag = {
  definition: string;
  must_have: string[];
  must_not_have: string[];
  edge_rule: string;
  priority: string;
};

type RawTagsFile = Record<string, Record<string, RawTag>>;

function loadTagsFile(path: string): {
  groups: TagGroupInput[];
  tags: TagInput[];
} {
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as RawTagsFile;
  const groups: TagGroupInput[] = [];
  const tags: TagInput[] = [];

  for (const [groupSlug, groupTags] of Object.entries(raw)) {
    groups.push({ slug: groupSlug, description: undefined });

    for (const [tagSlug, tagData] of Object.entries(groupTags)) {
      tags.push({
        slug: tagSlug,
        groupSlug,
        definition: tagData.definition,
        mustHave: tagData.must_have,
        mustNotHave: tagData.must_not_have,
        edgeRule: tagData.edge_rule || undefined,
        priority: tagData.priority || undefined,
      });
    }
  }

  return { groups, tags };
}

async function main(): Promise<void> {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  const filePath = resolve(thisDir, 'tags.json');
  const { groups, tags } = loadTagsFile(filePath);

  console.log(`Loaded ${groups.length} groups, ${tags.length} tags from ${filePath}`);

  const result = await upsertTagTaxonomy(groups, tags);

  if (!result.ok) {
    console.error(`ERROR [${result.error.kind}]:`, result.error);
    process.exit(1);
  }

  console.log(`Upserted ${result.value.groups} groups, ${result.value.tags} tags`);

  const taxonomy = await loadTagTaxonomy();
  if (!taxonomy.ok) {
    console.error(`Verification failed [${taxonomy.error.kind}]:`, taxonomy.error);
    process.exit(1);
  }

  console.log(`\nVerified ${taxonomy.value.allSlugs.length} tags across ${taxonomy.value.groups.length} groups:\n`);

  for (const group of taxonomy.value.groups) {
    console.log(`  [${group.slug}] (${group.tags.length} tags)`);
    for (const tag of group.tags) {
      console.log(`    ${tag.slug.padEnd(25)} ${tag.definition.slice(0, 60)}...`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
