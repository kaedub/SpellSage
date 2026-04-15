import 'dotenv/config';

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { prisma } from '../libs/platform/adapters/prisma/client';

type SerializableOracleCardTag = {
  readonly id: number;
  readonly oracleCardId: string;
  readonly tagSlug: string;
  readonly source: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

function toSerializableRow(row: {
  id: number;
  oracleCardId: string;
  tagSlug: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}): SerializableOracleCardTag {
  return {
    id: row.id,
    oracleCardId: row.oracleCardId,
    tagSlug: row.tagSlug,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function main(): Promise<void> {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  const argPath = process.argv[2];
  const outputPath =
    argPath !== undefined && argPath !== ''
      ? resolve(process.cwd(), argPath)
      : resolve(thisDir, 'oracle-card-tags.json');

  const rows = await prisma.oracleCardTag.findMany({
    orderBy: [{ oracleCardId: 'asc' }, { tagSlug: 'asc' }, { source: 'asc' }],
    select: {
      id: true,
      oracleCardId: true,
      tagSlug: true,
      source: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const payload = rows.map(toSerializableRow);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2));

  console.log(`Exported ${payload.length} OracleCardTag rows to ${outputPath}`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to export OracleCardTag rows: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
