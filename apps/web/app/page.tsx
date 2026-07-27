import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Food Marketplace — Home',
  description: 'Order from local chefs. Fresh food, delivered.',
};

/** Marketing landing — static, no database work at request time. */
export default function MarketingHomePage() {
  return (
    <main>
      <h1>Food Marketplace</h1>
      <p>Discover chefs near you and order fresh meals for delivery.</p>
      <p>
        <Link href="/browse">Browse dishes</Link>
      </p>
    </main>
  );
}
