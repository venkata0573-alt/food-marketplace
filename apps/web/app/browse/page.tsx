import Link from 'next/link';
import dynamic from 'next/dynamic';
import { decodeDishBrowseCursor, encodeCursor } from '@food-marketplace/shared/cursor-pagination';

import { runWithServices } from '../../src/server/context';

const BrowseFooter = dynamic(() => import('./BrowseFooter').then((mod) => mod.BrowseFooter));

export const revalidate = 60;

interface BrowsePageProps {
  searchParams: Promise<{ cursor?: string }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const cursor = decodeDishBrowseCursor(params.cursor);
  const feed = await runWithServices((services) =>
    services.catalog.getBrowseFeed({ limit: 24, cursor }),
  );

  return (
    <main>
      <h1>Browse</h1>
      <ul>
        {feed.items.map((dish) => (
          <li key={dish.id}>
            <Link href={`/chefs/${dish.chef.slug}`}>{dish.name}</Link> — {dish.chef.displayName} (
            {dish.chef.city}) — ${(dish.priceCents / 100).toFixed(2)}
          </li>
        ))}
      </ul>
      {feed.nextCursor ? (
        <p>
          <Link href={`/browse?cursor=${encodeCursor(feed.nextCursor)}`}>Next page</Link>
        </p>
      ) : null}
      <BrowseFooter />
    </main>
  );
}
