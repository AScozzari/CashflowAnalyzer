const CACHE_NAME = 'easycashflows-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const STATIC_CACHE_FILES = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  OFFLINE_URL
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  '/api/auth/user',
  '/api/dashboard/stats', 
  '/api/movements',
  '/api/analytics'
];

// Install event - cache static files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_CACHE_FILES);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.open(CACHE_NAME).then(cache => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  // Handle API requests with cache-first strategy for specific endpoints
  if (url.pathname.startsWith('/api/')) {
    const shouldCache = API_CACHE_PATTERNS.some(pattern => 
      url.pathname.includes(pattern)
    );
    
    if (shouldCache && request.method === 'GET') {
      event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
          return cache.match(request).then(cachedResponse => {
            if (cachedResponse) {
              // Return cached version and update in background
              fetch(request).then(response => {
                if (response.status === 200) {
                  cache.put(request, response.clone());
                }
              }).catch(() => {});
              return cachedResponse;
            }
            
            // If not in cache, fetch and cache
            return fetch(request).then(response => {
              if (response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            }).catch(() => {
              // Return offline response for critical endpoints
              if (url.pathname.includes('/api/auth/user')) {
                return new Response(JSON.stringify({
                  error: 'Offline - data not available'
                }), {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              throw error;
            });
          });
        })
      );
    } else {
      // For non-cacheable API requests, just try to fetch
      event.respondWith(fetch(request));
    }
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then(response => {
          // Cache successful responses for static assets
          if (response.status === 200 && request.method === 'GET') {
            const responseClone = response.clone();
            cache.put(request, responseClone);
          }
          return response;
        });
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline actions when connection is restored
      handleBackgroundSync()
    );
  }
});

async function handleBackgroundSync() {
  try {
    // Process any queued offline actions
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
      } catch (error) {
        console.error('Failed to sync offline action:', error);
      }
    }
    
    // Clear processed actions
    await clearOfflineActions();
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getOfflineActions() {
  // Retrieve offline actions from IndexedDB or localStorage
  return [];
}

async function processOfflineAction(action) {
  // Process individual offline actions
  return fetch(action.url, action.options);
}

async function clearOfflineActions() {
  // Clear processed offline actions
}