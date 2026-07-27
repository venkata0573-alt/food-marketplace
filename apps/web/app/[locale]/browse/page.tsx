import dynamic from 'next/dynamic';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { decodeDishBrowseCursor } from '@food-marketplace/shared/cursor-pagination';

import { BrowseFeedSuccess } from '../../../src/client/components/browse-feed';
import { runWithServices } from '../../../src/server/context';

const BrowseFooter = dynamic(() => import('./BrowseFooter').then((mod) => mod.BrowseFooter));

export const revalidate = 60;

interface BrowsePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string }>;
}

export default async function BrowsePage({ params, searchParams }: BrowsePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Browse');

  const query = await searchParams;
  const cursor = decodeDishBrowseCursor(query.cursor);
  const feed = await runWithServices((services) =>
    services.catalog.getBrowseFeed({ limit: 24, cursor }),
  );

  return (
    <main>
      <h1>{t('title')}</h1>
      <BrowseFeedSuccess
        items={feed.items}
        nextCursor={feed.nextCursor}
        emptyTitle={t('emptyTitle')}
        emptyDescription={t('emptyDescription')}
        nextLabel={t('next')}
      />
      <BrowseFooter />
    </main>
  );
}
