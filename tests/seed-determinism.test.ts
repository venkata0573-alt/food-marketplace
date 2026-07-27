import {
  buildSeedPlan,
  DETERMINISTIC_SEED,
  ORDER_STATUSES,
  SEED_COUNTS,
  seedPlanFingerprint,
} from '@food-marketplace/db/seed/plan';
import { describe, expect, it } from 'vitest';

describe('deterministic seed plan', () => {
  it('produces stable fingerprints for the fixed seed', () => {
    const a = seedPlanFingerprint(buildSeedPlan(DETERMINISTIC_SEED));
    const b = seedPlanFingerprint(buildSeedPlan(DETERMINISTIC_SEED));
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(100);
  });

  it('matches required entity counts', () => {
    const plan = buildSeedPlan(DETERMINISTIC_SEED);
    expect(plan.chefs).toHaveLength(SEED_COUNTS.chefs);
    expect(plan.dishes).toHaveLength(SEED_COUNTS.dishes);
    expect(plan.orders).toHaveLength(SEED_COUNTS.orders);
  });

  it('covers every order status equally', () => {
    const plan = buildSeedPlan(DETERMINISTIC_SEED);
    const byStatus = new Map<string, number>();
    for (const status of ORDER_STATUSES) {
      byStatus.set(status, 0);
    }
    for (const order of plan.orders) {
      byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1);
    }
    for (const status of ORDER_STATUSES) {
      expect(byStatus.get(status)).toBe(10);
    }
  });
});
