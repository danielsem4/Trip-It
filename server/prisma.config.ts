import "dotenv/config";
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Migrations need a direct connection; on Neon DATABASE_URL is the pooled one.
    url: process.env['DATABASE_URL_UNPOOLED'] ? env('DATABASE_URL_UNPOOLED') : env('DATABASE_URL'),
  },
  migrations: {
    seed: 'npx ts-node prisma/seed.ts',
  },
});
