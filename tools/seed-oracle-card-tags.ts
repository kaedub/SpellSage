import 'dotenv/config';

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import { upsertOracleCardTags } from '@platform/db';
import { prisma } from '../libs/platform/adapters/prisma/client';

const RawOracleCardTagSchema = z.object({
  id: z.number().int().optional(),
  oracleCardId: z.string().min(1),
  tagSlug: z.string().min(1),
  source: z.string().min(1),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

const RawOracleCardTagsSchema = z.array(RawOracleCardTagSchema);

function resolveFilePath(): string {
  const argPath = process.argv[2];
  if (argPath !== undefined && argPath !== '') {
    return resolve(process.cwd(), argPath);
  }

  const thisDir = dirname(fileURLToPath(import.meta.url));
  return resolve(thisDir, 'oracle-card-tags.json');
}

async function main(): Promise<void> {
  const filePath = resolveFilePath();
  const rawText = await readFile(filePath, 'utf-8');
  const rawJson: unknown = JSON.parse(rawText);
  const parsed = RawOracleCardTagsSchema.parse(rawJson);

  const inputs = parsed.map((row) => ({
    oracleCardId: row.oracleCardId,
    tagSlug: row.tagSlug,
    source: row.source,
    createdAt: row.createdAt !== undefined ? new Date(row.createdAt) : undefined,
    updatedAt: row.updatedAt !== undefined ? new Date(row.updatedAt) : undefined,
  }));

  console.log(`Seeding ${inputs.length.toLocaleString()} OracleCardTag rows from ${filePath}`);
  const upserted = await upsertOracleCardTags(inputs);
  console.log(`Upserted ${upserted.toLocaleString()} OracleCardTag rows`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to seed OracleCardTag rows: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
