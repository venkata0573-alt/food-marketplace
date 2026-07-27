'use client';
// client-justification: route-level error UI with retry.

import { ErrorState } from '../../../../src/client/components/async-ui';

export default function ChefProfileError({
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
