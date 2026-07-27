import type { Client } from '../db/with-client';

export interface CatalogRepository {
  countActiveDishes(): Promise<number>;
}

export function createCatalogRepository(client: Client): CatalogRepository {
  return {
    async countActiveDishes() {
      const result = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM dishes WHERE deleted_at IS NULL`,
      );
      return Number(result.rows[0]?.count ?? 0);
    },
  };
}
