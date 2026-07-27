import { timedQuery } from '../db/timed-query';
import type { CursorPage, DishBrowseCursor } from '@food-marketplace/shared/cursor-pagination';

import type { Client } from '../db/with-client';

export interface DishListRow {
  id: string;
  chefId: string;
  name: string;
  priceCents: number;
  createdAt: string;
}

export interface ChefSummaryRow {
  id: string;
  slug: string;
  displayName: string;
  city: string;
}

export interface ChefProfileRow extends ChefSummaryRow {
  bio: string;
}

export interface CatalogRepository {
  countActiveDishes(): Promise<number>;
  listDishesPage(input: {
    limit: number;
    cursor: DishBrowseCursor | null;
  }): Promise<CursorPage<DishListRow, DishBrowseCursor>>;
  batchGetChefsByIds(ids: readonly string[]): Promise<ChefSummaryRow[]>;
  getChefProfileBySlug(slug: string): Promise<ChefProfileRow | null>;
}

export function createCatalogRepository(client: Client): CatalogRepository {
  return {
    async countActiveDishes() {
      const result = await timedQuery('catalog.countActiveDishes', () =>
        client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM dishes WHERE deleted_at IS NULL`,
        ),
      );
      return Number(result.rows[0]?.count ?? 0);
    },

    async listDishesPage({ limit, cursor }) {
      const result = await timedQuery('catalog.listDishesPage', () => {
        if (cursor) {
          return client.query<DishListRow>(
            `SELECT id, chef_id AS "chefId", name, price_cents AS "priceCents", created_at AS "createdAt"
             FROM dishes
             WHERE deleted_at IS NULL
               AND (created_at, id) < ($1::timestamptz, $2::uuid)
             ORDER BY created_at DESC, id DESC
             LIMIT $3`,
            [cursor.createdAt, cursor.id, limit + 1],
          );
        }
        return client.query<DishListRow>(
          `SELECT id, chef_id AS "chefId", name, price_cents AS "priceCents", created_at AS "createdAt"
           FROM dishes
           WHERE deleted_at IS NULL
           ORDER BY created_at DESC, id DESC
           LIMIT $1`,
          [limit + 1],
        );
      });

      const rows = result.rows;
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      const last = items.at(-1);
      const nextCursor =
        hasMore && last
          ? {
              createdAt: last.createdAt,
              id: last.id,
            }
          : null;

      return { items, nextCursor };
    },

    async batchGetChefsByIds(ids) {
      if (ids.length === 0) {
        return [];
      }
      const result = await timedQuery('catalog.batchGetChefsByIds', () =>
        client.query<ChefSummaryRow>(
          `SELECT id, slug, display_name AS "displayName", city
           FROM chefs
           WHERE deleted_at IS NULL AND id = ANY($1::uuid[])
           ORDER BY array_position($1::uuid[], id)`,
          [ids],
        ),
      );
      return result.rows;
    },

    async getChefProfileBySlug(slug) {
      const result = await timedQuery('catalog.getChefProfileBySlug', () =>
        client.query<ChefProfileRow>(
          `SELECT id, slug, display_name AS "displayName", city, bio
           FROM chefs
           WHERE deleted_at IS NULL AND slug = $1
           LIMIT 1`,
          [slug],
        ),
      );
      return result.rows[0] ?? null;
    },
  };
}
