import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'libs/platform/prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
