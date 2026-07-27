'use client';
// client-justification: renders browse success UI; URL cursor is shareable server-driven state.

import { Link } from '../../../i18n/navigation';

import type { BrowseDishCard } from '../../server/services/catalog-read.service';
import type { DishBrowseCursor } from '@food-marketplace/shared/cursor-pagination';
import { encodeCursor } from '@food-marketplace/shared/cursor-pagination';

import { EmptyState } from './async-ui';

export function BrowseFeedSuccess({
  items,
  nextCursor,
  emptyTitle,
  emptyDescription,
  nextLabel,
}: {
  items: BrowseDishCard[];
  nextCursor: DishBrowseCursor | null;
  emptyTitle: string;
  emptyDescription: string;
  nextLabel: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={<Link href="/">Home</Link>}
      />
    );
  }

  return (
    <>
      <ul>
        {items.map((dish) => (
          <li key={dish.id}>
            <Link href={`/chefs/${dish.chef.slug}`}>{dish.name}</Link> — {dish.chef.displayName} (
            {dish.chef.city}) — ${(dish.priceCents / 100).toFixed(2)}
          </li>
        ))}
      </ul>
      {nextCursor ? (
        <p>
          <Link href={`/browse?cursor=${encodeCursor(nextCursor)}`}>{nextLabel}</Link>
        </p>
      ) : null}
    </>
  );
}
