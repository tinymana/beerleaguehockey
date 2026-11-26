import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 2000 },
  // Whole simulated games run in some tests; a shared CI runner is several times slower than a workstation.
  test: { include: ['tests/**/*.test.ts'], environment: 'node', testTimeout: 60000 },
});
