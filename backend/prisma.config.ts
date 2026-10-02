import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
config({ path: '../.env', quiet: true });
export default defineConfig({ schema: 'prisma/schema.prisma', migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed/index.ts' }, datasource: { url: process.env.DATABASE_URL ?? 'postgresql://localhost/splocal' } });
