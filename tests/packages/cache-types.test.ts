import { describe, expect, it } from 'vitest';

import { buildCacheKey, userScopedCacheKey } from '../../packages/cache/src/types';

describe('cache keys', () => {
  it('joins segments with colons', () => {
    expect(buildCacheKey('browse', 'start', '24')).toBe('browse:start:24');
  });

  it('scopes keys to a user id', () => {
    expect(userScopedCacheKey('u1', 'favorites')).toBe('user:u1:favorites');
  });
});
