import { runWithServices } from '../../../src/server/context';

export const revalidate = 300;

interface ChefProfilePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ChefProfilePage({ params }: ChefProfilePageProps) {
  const { slug } = await params;
  const profile = await runWithServices((services) => services.catalog.getChefProfile(slug));

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
    </main>
  );
}
