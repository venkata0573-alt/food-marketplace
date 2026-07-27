import type { CacheStore, CacheTag } from './types';
import { createNoopCacheStore, createRedisCacheStore } from './redis-store';

/** Redis down → serve uncached (never fail the request). */
export function createResilientCacheStore(redisUrl: string): CacheStore {
  const primary = createRedisCacheStore(redisUrl);

  async function safe<T>(fn: () => Promise<T>, fallbackValue: T): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.warn('[cache] redis unavailable, serving uncached', error);
      return fallbackValue;
    }
  }

  return {
    get<T>(key: string) {
      return safe(() => primary.get<T>(key), null);
    },
    set<T>(key: string, value: T, ttlSeconds: number, tags?: CacheTag[]) {
      return safe(() => primary.set(key, value, ttlSeconds, tags), undefined);
    },
    invalidateTags(tags: CacheTag[]) {
      return safe(() => primary.invalidateTags(tags), undefined);
    },
  };
}

export function resolveCacheStore(): CacheStore {
  const url = process.env.REDIS_URL;
  if (!url) {
    return createNoopCacheStore();
  }
  return createResilientCacheStore(url);
}
