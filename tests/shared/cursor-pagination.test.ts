import { describe, expect, it } from 'vitest';

import {
  decodeDishBrowseCursor,
  encodeCursor,
  type DishBrowseCursor,
} from '../../packages/shared/cursor-pagination';

describe('cursor pagination', () => {
  const cursor: DishBrowseCursor = {
    createdAt: '2024-01-01T00:00:00.000Z',
    id: '11111111-1111-4111-8111-111111111111',
  };

  it('round-trips browse cursors', () => {
    const encoded = encodeCursor(cursor);
    expect(decodeDishBrowseCursor(encoded)).toEqual(cursor);
  });

  it('returns null for invalid payloads', () => {
    expect(decodeDishBrowseCursor('not-base64')).toBeNull();
    expect(decodeDishBrowseCursor(null)).toBeNull();
  });
});
