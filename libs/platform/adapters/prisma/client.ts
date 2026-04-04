import { existsSync } from 'node:fs';
import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

/**
 * `dotenv/config` only reads `.env` from `process.cwd()`. The API is often started
 * with cwd `apps/api`, while this repo keeps `.env` at the workspace root.
 */
function resolveWorkspaceRoot(): string | undefined {
  const nx = process.env.NX_WORKSPACE_ROOT;
  if (nx !== undefined && nx !== '') {
    return path.resolve(nx);
  }
  let dir = path.resolve(process.cwd());
  for (let i = 0; i < 12; i += 1) {
    if (existsSync(path.join(dir, 'nx.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
  return undefined;
}

function loadEnv(): void {
  const root = resolveWorkspaceRoot();
  if (root !== undefined) {
    const rootEnv = path.join(root, '.env');
    if (existsSync(rootEnv)) {
      dotenv.config({ path: rootEnv, quiet: true });
    }
  }
  dotenv.config({ quiet: true });
}

loadEnv();

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

