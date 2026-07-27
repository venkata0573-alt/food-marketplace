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

export function userScopedCacheKey(userId: string, ...parts: string[]): string {
  return buildCacheKey('user', userId, ...parts);
}

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number, tags?: CacheTag[]): Promise<void>;
  invalidateTags(tags: CacheTag[]): Promise<void>;
}
