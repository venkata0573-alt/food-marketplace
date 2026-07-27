'use client';
// client-justification: global error boundary reports to Sentry and renders a fallback shell.

import { useEffect } from 'react';

import { ErrorState } from '../src/client/components/async-ui';

function reportToSentry(error: Error, digest?: string) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.error('[global-error]', digest, error);
    return;
  }
  void import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.captureException(error, { extra: { digest } });
    })
    .catch(() => {
      console.error('[global-error]', digest, error);
    });
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportToSentry(error, error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <ErrorState
          message="We're having trouble loading the app. Please try again."
          onRetry={reset}
        />
      </body>
    </html>
  );
}
