import type Redis from 'ioredis';

export type RateLimitTier = 'ip' | 'user' | 'endpoint';

export interface RateLimitPolicy {
  tier: RateLimitTier;
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** Sliding window counter using Redis sorted set (score = epoch ms). */
export class SlidingWindowRateLimiter {
  constructor(private readonly redis: Redis) {}

  private redisKey(policy: RateLimitPolicy): string {
    return `ratelimit:${policy.tier}:${policy.key}`;
  }

  async check(policy: RateLimitPolicy): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - policy.windowSeconds * 1000;
    const key = this.redisKey(policy);

    const multi = this.redis.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zadd(key, now, `${now}:${Math.random()}`);
    multi.zcard(key);
    multi.expire(key, policy.windowSeconds + 1);
    const results = await multi.exec();

    const count = Number(results?.[2]?.[1] ?? 0);
    const allowed = count <= policy.limit;
    const remaining = Math.max(0, policy.limit - count);

    let retryAfterSeconds = policy.windowSeconds;
    if (!allowed) {
      const oldest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestScore = Number(oldest[1] ?? now);
      retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldestScore + policy.windowSeconds * 1000 - now) / 1000),
      );
    }

    return { allowed, remaining, retryAfterSeconds };
  }
}

export const RATE_LIMIT_POLICIES = {
  ipGlobal: { limit: 300, windowSeconds: 60 },
  userAuthenticated: { limit: 120, windowSeconds: 60 },
  endpointCheckout: { limit: 10, windowSeconds: 60 },
  endpointSignup: { limit: 5, windowSeconds: 300 },
  endpointLogin: { limit: 20, windowSeconds: 300 },
} as const;

export function rateLimit429Body(retryAfterSeconds: number): {
  status: 429;
  headers: Record<string, string>;
  body: { error: { code: string; message: string } };
} {
  return {
    status: 429,
    headers: { 'Retry-After': String(retryAfterSeconds) },
    body: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  };
}
