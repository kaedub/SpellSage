import type { Prisma } from '@prisma/client';

import { prisma } from '../adapters/prisma/client';

export type OracleCardTagSeedInput = {
  readonly oracleCardId: string;
  readonly tagSlug: string;
  readonly source: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
};

const UPSERT_BATCH_SIZE = 500;

function toCreateData(entry: OracleCardTagSeedInput): Prisma.OracleCardTagUncheckedCreateInput {
  return {
    oracleId: entry.oracleCardId,
    tagSlug: entry.tagSlug,
    source: entry.source,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function toUpdateData(entry: OracleCardTagSeedInput): Prisma.OracleCardTagUncheckedUpdateInput {
  if (entry.updatedAt === undefined) {
    return {};
  }
  return {
    updatedAt: entry.updatedAt,
  };
}

export async function upsertOracleCardTags(
  entries: readonly OracleCardTagSeedInput[],
): Promise<number> {
  if (entries.length === 0) {
    return 0;
  }

  let processed = 0;
  for (let start = 0; start < entries.length; start += UPSERT_BATCH_SIZE) {
    const batch = entries.slice(start, start + UPSERT_BATCH_SIZE);
    const operations = batch.map((entry) =>
      prisma.oracleCardTag.upsert({
        where: {
          oracleId_tagSlug_source: {
            oracleId: entry.oracleCardId,
            tagSlug: entry.tagSlug,
            source: entry.source,
          },
        },
        update: toUpdateData(entry),
        create: toCreateData(entry),
      }),
    );
    await prisma.$transaction(operations);
    processed += batch.length;
  }

  return processed;
}
