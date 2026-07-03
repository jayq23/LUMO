const CACHE_NAME = 'lumo-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-192.png',
  '/logo-512.png',
];

// Install event - cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache open failed:', err);
      })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // API requests - network first, fallback to cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline - return cached response or error
          return caches.match(event.request)
            .then(cachedResponse => {
              return cachedResponse || new Response(
                JSON.stringify({ error: 'Offline - cached data unavailable' }),
                { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } }
              );
            });
        })
    );
  } else {
    // Static assets - network first, then cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed - try cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Only fall back to the HTML shell for actual page navigations.
              // Returning HTML for a failed JS/CSS/font/image request corrupts
              // the render (browser tries to decode HTML as binary asset).
              if (event.request.mode === 'navigate' ||
                  event.request.headers.get('accept')?.includes('text/html')) {
                return caches.match('/index.html');
              }
              // For binary/static assets, fail cleanly with an empty response
              return new Response('', { status: 504, statusText: 'Offline' });
            });
        })
    );
  }
});