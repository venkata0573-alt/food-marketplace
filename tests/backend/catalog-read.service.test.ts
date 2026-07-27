import { describe, expect, it, vi } from 'vitest';

import { createCatalogReadService } from '../../apps/web/src/server/services/catalog-read.service';
import type { CatalogRepository } from '../../apps/web/src/server/repositories/catalog.repository';
import type { CacheStore } from '../../packages/cache/src/types';

function memoryCache(initial: Record<string, unknown> = {}): CacheStore {
  const store = new Map(Object.entries(initial));
  return {
    async get<T>(key: string) {
      return (store.get(key) as T | undefined) ?? null;
    },
    async set(key, value) {
      store.set(key, value);
    },
    async invalidateTags() {},
  };
}

describe('createCatalogReadService', () => {
  it('returns cached featured dish count without hitting repo', async () => {
    const repo: CatalogRepository = {
      countActiveDishes: vi.fn(async () => 99),
      listDishesPage: vi.fn(),
      batchGetChefsByIds: vi.fn(),
      getChefProfileBySlug: vi.fn(),
    };
    const cache = memoryCache({ 'catalog:active-dish-count': 5 });
    const service = createCatalogReadService(repo, cache);
    await expect(service.getFeaturedDishCount()).resolves.toBe(5);
    expect(repo.countActiveDishes).not.toHaveBeenCalled();
  });
});
