import { readFile } from "node:fs/promises";
import path from "node:path";

type TagDefinitions = Record<string, Record<string, unknown>>;

const readTags = async (): Promise<TagDefinitions> => {
  const tagsPath = path.resolve(__dirname, "tags-improved.json");
  const raw = await readFile(tagsPath, "utf8");
  return JSON.parse(raw) as TagDefinitions;
};

const main = async (): Promise<void> => {
  const tags = await readTags();

  for (const [categoryName, categoryTags] of Object.entries(tags)) {
    const tagNames = Object.keys(categoryTags);
    console.log(`${categoryName}: ${tagNames.join(", ")}`);
  }
};

main().catch((error: unknown) => {
  console.error("Failed to print tags:", error);
  process.exitCode = 1;
});
