import { describe, expect, it, vi } from 'vitest';

import {
  rateLimit429Body,
  SlidingWindowRateLimiter,
  type RateLimitPolicy,
} from '../../packages/rate-limit/src/sliding-window';

function mockRedis(count: number, oldestScore?: number) {
  const multi = {
    zremrangebyscore: vi.fn().mockReturnThis(),
    zadd: vi.fn().mockReturnThis(),
    zcard: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: vi.fn(async () => [
      [null, 0],
      [null, 0],
      [null, count],
      [null, 1],
    ]),
  };
  return {
    multi: vi.fn(() => multi),
    zrange: vi.fn(async () => ['member', String(oldestScore ?? Date.now())]),
  };
}

describe('SlidingWindowRateLimiter', () => {
  const policy: RateLimitPolicy = {
    tier: 'ip',
    key: '127.0.0.1',
    limit: 2,
    windowSeconds: 60,
  };

  it('allows under limit', async () => {
    const limiter = new SlidingWindowRateLimiter(mockRedis(1) as never);
    const result = await limiter.check(policy);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('blocks over limit with retry-after', async () => {
    const limiter = new SlidingWindowRateLimiter(mockRedis(3, Date.now() - 1000) as never);
    const result = await limiter.check(policy);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe('rateLimit429Body', () => {
  it('sets Retry-After header', () => {
    const res = rateLimit429Body(30);
    expect(res.status).toBe(429);
    expect(res.headers['Retry-After']).toBe('30');
  });
});
