const CACHE_NAME = 'easycashflows-v2.1-ai-mobile';
const DATA_CACHE_NAME = 'easycashflows-data-v2.1';

// Core app shell files to cache
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes that should be cached for offline access
const API_CACHE_URLS = [
  '/api/auth/user',
  '/api/dashboard/stats',
  '/api/movements',
  '/api/analytics/cash-flow',
  '/api/analytics/status-distribution'
];

// Install event - cache core app shell
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    if (API_CACHE_URLS.some(apiUrl => url.pathname.startsWith(apiUrl))) {
      event.respondWith(
        caches.open(DATA_CACHE_NAME)
          .then(cache => {
            return cache.match(request)
              .then(cachedResponse => {
                if (cachedResponse) {
                  fetch(request)
                    .then(response => {
                      if (response.status === 200) {
                        cache.put(request, response.clone());
                      }
                    })
                    .catch(() => {});
                  return cachedResponse;
                }

                return fetch(request)
                  .then(response => {
                    if (response.status === 200) {
                      cache.put(request, response.clone());
                    }
                    return response;
                  })
                  .catch(() => {
                    if (url.pathname === '/api/auth/user') {
                      return new Response(JSON.stringify({
                        error: 'Offline mode - please reconnect'
                      }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                      });
                    }
                    throw new Error('Network failed and no cache available');
                  });
              });
          })
      );
      return;
    }

    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(JSON.stringify({
            error: 'Offline mode - this feature requires internet connection'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Handle app shell requests
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            throw new Error('Network failed and no cache available');
          });
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nuovi aggiornamenti disponibili',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'easycashflows-notification',
    data: { url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification('EasyCashFlows', options)
  );
});

console.log('[SW] Service Worker loaded successfully');