// ===================================================
// Vista Worship Planner — Service Worker v1.3
// Handles: Core asset caching, offline fallback,
//          background sync, cache versioning
// ===================================================

const CACHE_NAME = 'vista-worship-v1.3';
const BIBLE_CACHE = 'vista-bible-v1.0';
const DYNAMIC_CACHE = 'vista-dynamic-v1.0';

// Core assets to cache on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/bible_data.js',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/manage.html',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Google+Sans:wght@300;400;500;600;700&family=Google+Sans+Display:wght@400;500;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap',
];

// ── Install ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Vista Worship Planner v1.3');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache what we can, skip failures for external resources
      return Promise.allSettled(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Failed to cache: ${url}`, err);
          })
        )
      );
    }).then(() => {
      console.log('[SW] Core assets cached');
      return self.skipWaiting();
    })
  );
});

// ── Activate ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Vista Worship Planner');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== CACHE_NAME &&
              name !== BIBLE_CACHE &&
              name !== DYNAMIC_CACHE
            );
          })
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Ready to handle fetches');
      return self.clients.claim();
    })
  );
});

// ── Fetch Strategy ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Bible data: Cache-first (permanent offline)
  if (url.pathname.includes('bible_data')) {
    event.respondWith(cacheFirst(request, BIBLE_CACHE));
    return;
  }

  // Google Fonts: Cache-first
  if (url.hostname.includes('fonts.googleapis.com') || 
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Firebase / Firestore: Network-only (real-time data)
  if (url.hostname.includes('firebaseapp.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase.googleapis.com')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Google Drive audio/media: Network-only (streaming)
  if (url.hostname.includes('drive.google.com') ||
      url.hostname.includes('docs.google.com')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Core app files: Cache-first with network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Everything else: Network-first with cache fallback
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ── Cache Strategies ─────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return offlineFallback(request);
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || offlineFallback(request);
  }
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function offlineFallback(request) {
  const url = new URL(request.url);
  if (request.destination === 'document') {
    return caches.match('/') || caches.match('/index.html');
  }
  return new Response('Offline', { status: 503 });
}

// ── Message Handler ──────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.payload);
      })
    );
  }
});
