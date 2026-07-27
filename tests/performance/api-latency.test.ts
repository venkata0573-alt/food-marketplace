import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { GET } from '../../apps/web/app/health/live/route';

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

describe('API latency harness', () => {
  it('health route p95/p99 stay under budgets', async () => {
    const budget = JSON.parse(
      readFileSync(join(process.cwd(), 'budgets/api-latency.json'), 'utf8'),
    ) as { p95Ms: number; p99Ms: number };

    const samples: number[] = [];
    for (let i = 0; i < 40; i += 1) {
      const start = performance.now();
      const response = await GET();
      expect(response.status).toBe(200);
      samples.push(performance.now() - start);
    }

    expect(percentile(samples, 95)).toBeLessThan(budget.p95Ms);
    expect(percentile(samples, 99)).toBeLessThan(budget.p99Ms);
  });
});
