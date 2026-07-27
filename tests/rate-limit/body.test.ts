import { describe, expect, it } from 'vitest';

import { rateLimit429Body } from '@food-marketplace/rate-limit';

describe('rateLimit429Body', () => {
  it('includes Retry-After header value', () => {
    const payload = rateLimit429Body(42);
    expect(payload.status).toBe(429);
    expect(payload.headers['Retry-After']).toBe('42');
    expect(payload.body.error.code).toBe('RATE_LIMITED');
  });
});
