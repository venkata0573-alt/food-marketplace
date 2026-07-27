import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '../../i18n/navigation';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function MarketingHomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('lead')}</p>
      <p>
        <Link href="/browse">{t('browse')}</Link> · <Link href="/cart">{t('cart')}</Link>
      </p>
    </main>
  );
}
