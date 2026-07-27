import {
  buildCacheKey,
  CACHE_TTL_SECONDS,
  type CacheStore,
  resolveCacheStore,
} from '@food-marketplace/cache';
import { DataLoader } from '@food-marketplace/shared/dataloader';
import type { CursorPage, DishBrowseCursor } from '@food-marketplace/shared/cursor-pagination';

import type {
  CatalogRepository,
  ChefProfileRow,
  ChefSummaryRow,
  DishListRow,
} from '../repositories/catalog.repository';

export interface BrowseDishCard {
  id: string;
  name: string;
  priceCents: number;
  chef: Pick<ChefSummaryRow, 'slug' | 'displayName' | 'city'>;
}

export interface CatalogReadService {
  getFeaturedDishCount(): Promise<number>;
  getBrowseFeed(input: {
    limit: number;
    cursor: DishBrowseCursor | null;
  }): Promise<CursorPage<BrowseDishCard, DishBrowseCursor>>;
  getChefProfile(slug: string): Promise<ChefProfileRow | null>;
}

function createChefLoader(repo: CatalogRepository): DataLoader<string, ChefSummaryRow> {
  return new DataLoader(async (chefIds) => {
    const rows = await repo.batchGetChefsByIds(chefIds);
    const byId = new Map(rows.map((row) => [row.id, row]));
    return chefIds.map((id) => {
      const row = byId.get(id);
      if (!row) {
        return new Error(`chef ${id} not found`);
      }
      return row;
    });
  });
}

async function mapBrowsePage(
  repo: CatalogRepository,
  page: CursorPage<DishListRow, DishBrowseCursor>,
): Promise<CursorPage<BrowseDishCard, DishBrowseCursor>> {
  const loader = createChefLoader(repo);
  const items: BrowseDishCard[] = [];
  for (const dish of page.items) {
    const chef = await loader.load(dish.chefId);
    items.push({
      id: dish.id,
      name: dish.name,
      priceCents: dish.priceCents,
      chef: { slug: chef.slug, displayName: chef.displayName, city: chef.city },
    });
  }
  return { items, nextCursor: page.nextCursor };
}

export function createCatalogReadService(
  repo: CatalogRepository,
  cache: CacheStore = resolveCacheStore(),
): CatalogReadService {
  return {
    async getFeaturedDishCount() {
      const key = buildCacheKey('catalog', 'active-dish-count');
      const hit = await cache.get<number>(key);
      if (hit !== null) {
        return hit;
      }
      const count = await repo.countActiveDishes();
      await cache.set(key, count, CACHE_TTL_SECONDS.dishListings, ['dish-listings']);
      return count;
    },

    async getBrowseFeed(input) {
      const cacheKey = buildCacheKey(
        'browse',
        input.cursor ? `${input.cursor.id}:${input.cursor.createdAt}` : 'start',
        String(input.limit),
      );
      const hit = await cache.get<CursorPage<BrowseDishCard, DishBrowseCursor>>(cacheKey);
      if (hit) {
        return hit;
      }

      const page = await mapBrowsePage(repo, await repo.listDishesPage(input));
      await cache.set(cacheKey, page, CACHE_TTL_SECONDS.dishListings, [
        'browse-feed',
        'dish-listings',
      ]);
      return page;
    },

    async getChefProfile(slug) {
      const key = buildCacheKey('chef-profile', slug);
      const hit = await cache.get<ChefProfileRow>(key);
      if (hit) {
        return hit;
      }
      const profile = await repo.getChefProfileBySlug(slug);
      if (profile) {
        await cache.set(key, profile, CACHE_TTL_SECONDS.chefProfile, [`chef:${slug}`]);
      }
      return profile;
    },
  };
}
