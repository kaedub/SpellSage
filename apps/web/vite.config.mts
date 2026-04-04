/// <reference types='vitest' />
import path from 'node:path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const workspaceRoot = path.resolve(import.meta.dirname, '../..');

export default defineConfig(() => ({
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@shared': path.join(workspaceRoot, 'libs/shared'),
    },
  },
  cacheDir: '../../node_modules/.vite/web',
  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    port: 4200,
    host: 'localhost',
  },
  plugins: [tailwindcss(), react()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
