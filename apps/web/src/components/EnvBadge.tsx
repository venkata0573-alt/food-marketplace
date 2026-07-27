'use client';

import type { ReactElement } from 'react';

/** Client-safe env display — only NEXT_PUBLIC_* is allowed in this file. */
export function EnvBadge(): ReactElement {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? 'unknown';
  return <span data-testid="app-env">{appEnv}</span>;
}
