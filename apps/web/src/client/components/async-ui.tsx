'use client';
// client-justification: error retry actions and empty-state actions require client event handlers.

import type { ReactNode } from 'react';

export function BrowseListSkeleton() {
  return (
    <ul aria-busy="true" aria-label="Loading dishes">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} style={{ height: 24, background: '#eee', marginBottom: 8 }} />
      ))}
    </ul>
  );
}

export function PageHeaderSkeleton({ title }: { title: string }) {
  return (
    <header>
      <h1>{title}</h1>
      <div style={{ height: 12, width: '40%', background: '#eee' }} />
    </header>
  );
}

export function CartSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading cart">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ height: 48, background: '#eee', marginBottom: 8 }} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section role="alert">
      <h2>Something went wrong</h2>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    </section>
  );
}
