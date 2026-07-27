import Redis from 'ioredis';

import {
  RATE_LIMIT_POLICIES,
  SlidingWindowRateLimiter,
  type RateLimitPolicy,
  type RateLimitResult,
} from './sliding-window';

let limiter: SlidingWindowRateLimiter | undefined;
let redis: Redis | undefined;

export function createRateLimiterFromEnv(): SlidingWindowRateLimiter | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }
  if (!limiter) {
    redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
    limiter = new SlidingWindowRateLimiter(redis);
  }
  return limiter;
}

export interface EnforceRateLimitsInput {
  ip: string;
  userId?: string;
  endpointKey?: keyof typeof RATE_LIMIT_POLICIES;
}

export async function enforceRateLimits(
  input: EnforceRateLimitsInput,
): Promise<RateLimitResult | null> {
  const client = createRateLimiterFromEnv();
  if (!client) {
    return null;
  }

  const checks: RateLimitPolicy[] = [
    {
      tier: 'ip',
      key: input.ip,
      ...RATE_LIMIT_POLICIES.ipGlobal,
    },
  ];

  if (input.userId) {
    checks.push({
      tier: 'user',
      key: input.userId,
      ...RATE_LIMIT_POLICIES.userAuthenticated,
    });
  }

  if (input.endpointKey === 'endpointCheckout') {
    checks.push({
      tier: 'endpoint',
      key: `checkout:${input.ip}`,
      ...RATE_LIMIT_POLICIES.endpointCheckout,
    });
  }
  if (input.endpointKey === 'endpointSignup') {
    checks.push({
      tier: 'endpoint',
      key: `signup:${input.ip}`,
      ...RATE_LIMIT_POLICIES.endpointSignup,
    });
  }
  if (input.endpointKey === 'endpointLogin') {
    checks.push({
      tier: 'endpoint',
      key: `login:${input.ip}`,
      ...RATE_LIMIT_POLICIES.endpointLogin,
    });
  }

  for (const policy of checks) {
    const result = await client.check(policy);
    if (!result.allowed) {
      return result;
    }
  }

  return { allowed: true, remaining: RATE_LIMIT_POLICIES.ipGlobal.limit, retryAfterSeconds: 0 };
}
