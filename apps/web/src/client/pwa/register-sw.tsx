'use client';
// client-justification: registers the PWA service worker after hydration.

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline enhancements are best-effort — never block render.
    });
  }, []);
  return null;
}
