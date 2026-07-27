import { describe, expect, it } from 'vitest';

import { CircuitBreaker, CircuitOpenError } from '@food-marketplace/resilience';

describe('CircuitBreaker', () => {
  it('opens after repeated failures', async () => {
    const breaker = new CircuitBreaker({
      name: 'test',
      failureThreshold: 2,
      openDurationMs: 60_000,
      timeoutMs: 100,
      maxRetries: 0,
    });

    await expect(breaker.execute(async () => Promise.reject(new Error('fail')))).rejects.toThrow(
      'fail',
    );
    await expect(breaker.execute(async () => Promise.reject(new Error('fail')))).rejects.toThrow(
      'fail',
    );
    await expect(breaker.execute(async () => 'ok')).rejects.toBeInstanceOf(CircuitOpenError);
  });
});
