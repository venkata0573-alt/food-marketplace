import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'e2e/**',
      'packages/ui/.storybook/**',
      'packages/ui/src/a11y/**',
      '**/*.a11y.test.tsx',
    ],
    passWithNoTests: false,
    environment: 'node',
    environmentMatchGlobs: [
      ['packages/ui/**', 'jsdom'],
      ['apps/web/**/*.a11y.test.tsx', 'jsdom'],
    ],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'packages/domain/src/**/*.ts',
        'packages/shared-types/src/**/*.ts',
        'packages/shared/allergen-guard.ts',
        'packages/shared/authz.ts',
        'packages/shared/dataloader.ts',
        'packages/shared/cursor-pagination.ts',
        'packages/rate-limit/src/sliding-window.ts',
        'packages/rate-limit/src/index.ts',
        'packages/resilience/src/**/*.ts',
        'packages/cache/src/types.ts',
        'packages/db/src/seed/plan.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
