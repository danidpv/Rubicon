import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['shared/**/*.test.ts', 'backend/test/**/*.test.ts', 'frontend/tests/**/*.test.{ts,tsx}'], environment: 'node' } });
