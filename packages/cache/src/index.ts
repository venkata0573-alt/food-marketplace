import Redis from 'ioredis';

/** Explicit TTLs (seconds) — never cache user-scoped data without user id in the key. */
export const CACHE_TTL_SECONDS = {
  chefProfile: 5 * 60,
  dishListings: 60,
  availability: 10,
} as const;

export type CacheTag =
  `chef:${string}` | 'browse-feed' | 'dish-listings' | `availability:${string}`;

export function buildCacheKey(...parts: string[]): string {
  return parts.join(':');
}

/** User-scoped keys must include the user id as the first segment after prefix. */
export function userScopedCacheKey(userId: string, ...parts: string[]): string {
  return buildCacheKey('user', userId, ...parts);
}

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number, tags?: CacheTag[]): Promise<void>;
  invalidateTags(tags: CacheTag[]): Promise<void>;
}

export function createRedisCacheStore(redisUrl: string): CacheStore {
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 2, lazyConnect: true });

  async function tagKeys(tag: CacheTag): Promise<string[]> {
    return redis.smembers(`tag:${tag}`);
  }

  return {
    async get<T>(key: string): Promise<T | null> {
      const raw = await redis.get(key);
      if (raw === null) {
        return null;
      }
      return JSON.parse(raw) as T;
    },

    async set<T>(key: string, value: T, ttlSeconds: number, tags: CacheTag[] = []): Promise<void> {
      const payload = JSON.stringify(value);
      const multi = redis.multi();
      multi.set(key, payload, 'EX', ttlSeconds);
      for (const tag of tags) {
        multi.sadd(`tag:${tag}`, key);
        multi.expire(`tag:${tag}`, ttlSeconds + 60);
      }
      await multi.exec();
    },

    async invalidateTags(tags: CacheTag[]): Promise<void> {
      const keys = new Set<string>();
      for (const tag of tags) {
        for (const key of await tagKeys(tag)) {
          keys.add(key);
        }
      }
      if (keys.size === 0) {
        return;
      }
      const multi = redis.multi();
      for (const key of keys) {
        multi.del(key);
      }
      for (const tag of tags) {
        multi.del(`tag:${tag}`);
      }
      await multi.exec();
    },
  };
}

export function createNoopCacheStore(): CacheStore {
  return {
    async get() {
      return null;
    },
    async set() {},
    async invalidateTags() {},
  };
}

export function resolveCacheStore(): CacheStore {
  const url = process.env.REDIS_URL;
  if (!url) {
    return createNoopCacheStore();
  }
  return createRedisCacheStore(url);
}
