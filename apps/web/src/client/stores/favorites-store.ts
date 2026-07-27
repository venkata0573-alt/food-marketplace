'use client';
// client-justification: favorites toggle is optimistic client UI synced via React Query mutations.

import { create } from 'zustand';

interface FavoritesState {
  ids: Set<string>;
  toggleOptimistic: (dishId: string) => string[];
  rollback: (snapshot: string[]) => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set(),
  toggleOptimistic(dishId) {
    const snapshot = Array.from(get().ids);
    const next = new Set(get().ids);
    if (next.has(dishId)) {
      next.delete(dishId);
    } else {
      next.add(dishId);
    }
    set({ ids: next });
    return snapshot;
  },
  rollback(snapshot) {
    set({ ids: new Set(snapshot) });
  },
}));
