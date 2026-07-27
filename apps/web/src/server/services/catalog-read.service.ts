import type { CatalogRepository } from '../repositories/catalog.repository';

export interface CatalogReadService {
  getFeaturedDishCount(): Promise<number>;
}

export function createCatalogReadService(repo: CatalogRepository): CatalogReadService {
  return {
    async getFeaturedDishCount() {
      return repo.countActiveDishes();
    },
  };
}
