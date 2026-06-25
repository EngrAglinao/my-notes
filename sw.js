/**
 * sw.js — Service Worker for Church Media PWA
 * Handles offline caching of all core assets.
 *
 * ⚠️ GITHUB PAGES DEPLOYMENT NOTE:
 * If deploying to a GitHub Pages subpath (e.g., https://username.github.io/repo-name/),
 * update the CACHE_BASE_URL below to match your repository subpath:
 *   const CACHE_BASE_URL = '/repo-name/';
 * And update manifest.json "start_url" and "scope" to match:
 *   "start_url": "/repo-name/index.html"
 *   "scope": "/repo-name/"
 */

const CACHE_NAME = 'church-pwa-v1.0.0';
const CACHE_BASE_URL = '/'; // Change to '/your-repo-name/' for GitHub Pages subpath

const STATIC_ASSETS = [
  CACHE_BASE_URL,
  CACHE_BASE_URL + 'index.html',
  CACHE_BASE_URL + 'manage.html',
  CACHE_BASE_URL + 'styles.css',
  CACHE_BASE_URL + 'app.js',
  CACHE_BASE_URL + 'bible_data.js',
  CACHE_BASE_URL + 'manifest.json',
  // Google Fonts — cached on first visit
  'https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Google+Sans+Display:wght@400;500;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap',
];

// ────────────────────────────────────────────────
// INSTALL — Pre-cache all static assets
// ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker…');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Caching static assets');
      // Cache each asset individually so one failure doesn't break all
      const results = await Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('[SW] Failed to cache:', url, err);
        }))
      );
      console.log('[SW] Cache complete', results.filter(r => r.status === 'fulfilled').length, '/', STATIC_ASSETS.length);
    })
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// ────────────────────────────────────────────────
// ACTIVATE — Clean up old caches
// ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker…');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Service worker active and controlling clients');
      return self.clients.claim();
    })
  );
});

// ────────────────────────────────────────────────
// FETCH — Intercept and serve from cache (Cache-first for assets, Network-first for Firestore)
// ────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase / Firestore API calls — must always be online
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase.googleapis.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com/firebasejs')) {
    return; // Let the browser handle it normally
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Skip data: URIs
  if (url.protocol === 'data:') return;

  // Strategy: Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache, but also update cache in background (stale-while-revalidate)
        const networkUpdate = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        }).catch(() => {}); // Silence network errors during background update

        return cachedResponse;
      }

      // Not in cache — fetch from network and cache the response
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || !networkResponse.ok) {
          return networkResponse;
        }

        // Only cache same-origin and explicitly allowed cross-origin assets
        const shouldCache = 
          url.origin === self.location.origin ||
          url.hostname.includes('fonts.googleapis.com') ||
          url.hostname.includes('fonts.gstatic.com') ||
          url.hostname.includes('cdn.jsdelivr.net');

        if (shouldCache && networkResponse.type !== 'opaque') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }

        return networkResponse;
      }).catch((err) => {
        console.warn('[SW] Network fetch failed for:', event.request.url, err);
        // Return offline fallback for HTML navigation requests
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match(CACHE_BASE_URL + 'index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

// ────────────────────────────────────────────────
// MESSAGE — Handle messages from the app
// ────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
