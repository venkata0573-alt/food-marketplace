import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../..');
const fixture = (name: string) => path.join(repoRoot, 'tests/fixtures/eslint', name);

describe('food-marketplace/no-server-env-in-client', () => {
  it('allows NEXT_PUBLIC_* in client components', async () => {
    const eslint = new ESLint({ cwd: repoRoot });
    const code = fs.readFileSync(fixture('ClientOk.tsx'), 'utf8');
    const results = await eslint.lintText(code, {
      filePath: path.join(repoRoot, 'apps/web/src/components/ClientOk.tsx'),
    });
    expect(results[0]?.errorCount).toBe(0);
  });

  it('fails on non-prefixed process.env in client components', async () => {
    const eslint = new ESLint({ cwd: repoRoot });
    const code = fs.readFileSync(fixture('ClientBad.tsx'), 'utf8');
    const results = await eslint.lintText(code, {
      filePath: path.join(repoRoot, 'apps/web/src/components/ClientBad.tsx'),
    });
    expect(results[0]?.errorCount).toBeGreaterThan(0);
    expect(results[0]?.messages[0]?.ruleId).toBe('food-marketplace/no-server-env-in-client');
  });
});
