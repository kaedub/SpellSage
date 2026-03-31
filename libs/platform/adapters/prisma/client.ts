import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') {
    throw new Error(
      'DATABASE_URL is not set. Add it to a .env file at the repo root (see README).',
    );
  }
  return url;
}

const adapter = new PrismaPg({ connectionString: requireDatabaseUrl() });

export const prisma = new PrismaClient({ adapter });

