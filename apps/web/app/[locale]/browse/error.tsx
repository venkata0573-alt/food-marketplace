'use client';
// client-justification: segment error boundary must be a client component in App Router.

import { ErrorState } from '../../../src/client/components/async-ui';

export default function BrowseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <ErrorState message={error.message} onRetry={reset} />
    </main>
  );
}
