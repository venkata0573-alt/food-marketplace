import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

describe('food-marketplace/require-use-client-justification', () => {
  it('requires justification comment', async () => {
    const eslint = new ESLint({ cwd: process.cwd() });
    const bad = `'use client';\nexport function X() {}\n`;
    const results = await eslint.lintText(bad, {
      filePath: `${process.cwd()}/apps/web/src/client/components/Bad.tsx`,
    });
    expect(
      results[0]?.messages.some(
        (m) => m.ruleId === 'food-marketplace/require-use-client-justification',
      ),
    ).toBe(true);
  });
});
