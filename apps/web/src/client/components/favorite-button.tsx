'use client';
// client-justification: favorite button uses optimistic UI + rollback on mutation failure.

import { useMutation } from '@tanstack/react-query';

import { useFavoritesStore } from '../stores/favorites-store';

async function syncFavorite(dishId: string, favorited: boolean): Promise<void> {
  const response = await fetch('/api/favorites', {
    method: favorited ? 'POST' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dishId }),
  });
  if (!response.ok) {
    throw new Error('favorite sync failed');
  }
}

export function FavoriteButton({ dishId }: { dishId: string }) {
  const ids = useFavoritesStore((s) => s.ids);
  const toggleOptimistic = useFavoritesStore((s) => s.toggleOptimistic);
  const rollback = useFavoritesStore((s) => s.rollback);
  const favorited = ids.has(dishId);

  const mutation = useMutation({
    mutationFn: async () => {
      const snapshot = toggleOptimistic(dishId);
      try {
        await syncFavorite(dishId, !favorited);
      } catch (error) {
        rollback(snapshot);
        throw error;
      }
    },
  });

  return (
    <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {favorited ? 'Unfavorite' : 'Favorite'}
    </button>
  );
}
