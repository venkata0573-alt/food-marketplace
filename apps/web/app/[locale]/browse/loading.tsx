import { SkeletonStack } from '@food-marketplace/ui';

export default function BrowseLoading() {
  return (
    <main>
      <h1>Browse</h1>
      <SkeletonStack lines={6} />
    </main>
  );
}
