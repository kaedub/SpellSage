import tags from './tags-improved.json';

for (const [group, groupTags] of Object.entries(tags)) {
  console.log(`\n## ${group}`);
  for (const tagName of Object.keys(groupTags as Record<string, unknown>)) {
    console.log(`  ${tagName}`);
  }
}
