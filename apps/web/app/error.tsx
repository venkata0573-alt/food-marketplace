'use client';
// client-justification: root error boundary renders fallback UI for segment failures.

import { ErrorState } from '../src/client/components/async-ui';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorState message={error.message} onRetry={reset} />
      </body>
    </html>
  );
}
