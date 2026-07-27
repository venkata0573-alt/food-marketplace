import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

function loadJson(path: string): Record<string, number> {
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, number>;
}

describe('Layer 7 web vitals budgets', () => {
  it('committed Lighthouse baseline stays under hard gates', () => {
    const gates = loadJson(join(process.cwd(), 'budgets/web-vitals.json'));
    const baseline = loadJson(join(process.cwd(), 'baseline/lighthouse-home.json'));

    expect(baseline.ttfbMsP75).toBeLessThanOrEqual(gates.ttfbMsP75);
    expect(baseline.lcpMsP75).toBeLessThanOrEqual(gates.lcpMsP75);
    expect(baseline.inpMsP75).toBeLessThanOrEqual(gates.inpMsP75);
    expect(baseline.clsMax).toBeLessThanOrEqual(gates.clsMax);
  });
});

describe('Layer 7 bundle budget config', () => {
  it('documents a first-load JS ceiling', () => {
    const budget = loadJson(join(process.cwd(), 'budgets/first-load-js.json'));
    expect(budget.maxGzipKb).toBeLessThanOrEqual(180);
  });
});

describe('Layer 7 query latency policy', () => {
  it('defines 100ms single-query ceiling', () => {
    const budget = loadJson(join(process.cwd(), 'budgets/query-latency.json'));
    expect(budget.maxQueryMs).toBe(100);
  });
});
