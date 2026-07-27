import { geocodeCity } from '../../../../src/server/integrations/mapbox.client';
import { runWithServices } from '../../../../src/server/context';
import { setRequestLocale } from 'next-intl/server';

export const revalidate = 300;

interface ChefProfilePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ChefProfilePage({ params }: ChefProfilePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const profile = await runWithServices((services) => services.catalog.getChefProfile(slug));
  const map = profile ? await geocodeCity(profile.city) : null;

  if (!profile) {
    return (
      <main>
        <h1>Chef not found</h1>
      </main>
    );
  }

  return (
    <main>
      <h1>{profile.displayName}</h1>
      <p>{profile.city}</p>
      <p>{profile.bio}</p>
      {map && !map.ok ? <p>{map.message}</p> : null}
      {map?.ok ? (
        <p aria-label="map-coordinates">
          Map: {map.feature.placeName} ({map.feature.latitude.toFixed(3)},{' '}
          {map.feature.longitude.toFixed(3)})
        </p>
      ) : null}
    </main>
  );
}
