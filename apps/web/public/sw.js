const SHELL = ['/', '/browse', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('fm-shell-v1').then((cache) => cache.addAll(SHELL.filter(Boolean))));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        if (response.ok && event.request.url.includes('/browse')) {
          void caches.open('fm-shell-v1').then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    }),
  );
});
