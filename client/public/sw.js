// SERVICE WORKER DISABLED - Preventing fetch conflicts
console.log('[SW] Service worker disabled to prevent network conflicts');

// Immediately unregister and skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Installing - but will skip waiting');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated - cleaning up');
  // Clear all caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// Do not intercept any fetch requests
self.addEventListener('fetch', (event) => {
  // Let all requests pass through normally
  return;
});