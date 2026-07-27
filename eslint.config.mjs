import eslint from '@eslint/js';
import { foodMarketplacePlugin } from '@food-marketplace/config/eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/coverage/**',
      'tests/fixtures/**',
      'apps/web/next-env.d.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.{tsx,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'food-marketplace': foodMarketplacePlugin,
    },
    rules: {
      'food-marketplace/no-server-env-in-client': 'error',
    },
  },
  {
    files: ['apps/web/app/**/*.{ts,tsx}', 'apps/web/middleware.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/repositories/**',
                '../src/server/repositories/*',
                '../../src/server/repositories/*',
              ],
              message:
                'Routes/actions must call services via context — repositories are not allowed.',
            },
            {
              group: ['@food-marketplace/db', '@food-marketplace/db/*'],
              message: 'Routes/actions must not access the database layer directly.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/server/services/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['apps/web/app/**', '../../app/**', '../../../app/**'],
              message: 'Services must not import route layers.',
            },
            {
              group: ['@food-marketplace/db', '@food-marketplace/db/*'],
              message: 'Services must use repositories — not @food-marketplace/db directly.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/server/repositories/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/services/**', '../services/**'],
              message: 'Repositories must not import services.',
            },
            {
              group: ['apps/web/app/**'],
              message: 'Repositories must not import routes.',
            },
          ],
        },
      ],
    },
  },
);
