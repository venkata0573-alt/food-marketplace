import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CheckoutForm } from '../../../src/client/forms/checkout-form';

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Cart');

  const demoChefId = '11111111-1111-4111-8111-111111111111';
  return (
    <main>
      <h1>{t('title')}</h1>
      <CheckoutForm chefId={demoChefId} submitLabel={t('submit')} />
    </main>
  );
}
