import type { Metadata } from 'next';

import { runWithServices } from '../src/server/context';

export const metadata: Metadata = {
  title: 'Food Marketplace',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const dishCount = await runWithServices((services) => services.catalog.getFeaturedDishCount());
  return (
    <main>
      <h1>Food Marketplace</h1>
      <p>Server-first catalog read ({dishCount} active dishes).</p>
    </main>
  );
}
