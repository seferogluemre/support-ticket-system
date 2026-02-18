import type { PrismaConfig } from '@prisma/config';
import { loadEnv } from './config/env';

// Database config'indeki env'yi yükle (fallback dahil)
loadEnv();

export default {
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
    seed: 'bun ./src/seeder/cli.ts run',
  },
  experimental: {
    externalTables: true,
  },
} satisfies PrismaConfig;
