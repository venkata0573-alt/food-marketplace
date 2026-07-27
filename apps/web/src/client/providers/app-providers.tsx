'use client';
// client-justification: composes client-only providers (query, PWA) under the RSC root layout.

import type { ReactNode } from 'react';

import { OfflineMutationDrain } from '../offline/mutation-queue';
import { QueryProvider } from '../providers/query-provider';
import { ServiceWorkerRegister } from '../pwa/register-sw';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <ServiceWorkerRegister />
      <OfflineMutationDrain />
    </QueryProvider>
  );
}
