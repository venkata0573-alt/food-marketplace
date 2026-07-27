import { describe, expect, it } from 'vitest';
import { marketplaceId } from '@food-marketplace/shared-types';

describe('workspace', () => {
  it('loads shared-types from the monorepo', () => {
    expect(marketplaceId('demo')).toBe('demo');
  });
});
