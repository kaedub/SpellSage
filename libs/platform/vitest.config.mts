import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const platformRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(platformRoot, '../..');

export default defineConfig({
  root: platformRoot,
  test: {
    environment: 'node',
    include: ['**/*.spec.ts'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@shared': path.join(workspaceRoot, 'libs/shared/index.ts'),
      '@shared/search': path.join(workspaceRoot, 'libs/shared/search.ts'),
      '@shared/result': path.join(workspaceRoot, 'libs/shared/result.ts'),
    },
  },
});
