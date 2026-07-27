import { buildSeedPlan, seedPlanFingerprint } from '@food-marketplace/db';
import { describe, expect, it } from 'vitest';

describe('buildSeedPlan', () => {
  it('is deterministic for a fixed seed', () => {
    const a = buildSeedPlan(42);
    const b = buildSeedPlan(42);
    expect(seedPlanFingerprint(a)).toBe(seedPlanFingerprint(b));
    expect(a.chefs.length).toBeGreaterThan(0);
    expect(a.dishes.length).toBeGreaterThan(0);
  });
});
