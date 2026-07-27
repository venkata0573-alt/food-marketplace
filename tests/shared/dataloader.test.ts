import { describe, expect, it } from 'vitest';

import { DataLoader } from '../../packages/shared/dataloader';

describe('DataLoader', () => {
  it('batches concurrent loads', async () => {
    const batches: string[][] = [];
    const loader = new DataLoader(async (keys) => {
      batches.push([...keys]);
      return keys.map((k) => k.toUpperCase());
    });

    const [a, b] = await Promise.all([loader.load('a'), loader.load('b')]);
    expect(a).toBe('A');
    expect(b).toBe('B');
    expect(batches).toHaveLength(1);
    expect(batches[0]?.sort()).toEqual(['a', 'b']);
  });
});
