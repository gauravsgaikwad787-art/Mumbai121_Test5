// Mumbai121 Service Worker
// Version this cache — increment when you deploy updates so old caches are cleared
const CACHE_NAME = 'mumbai121-v1';

// Core pages and assets to pre-cache on install
const PRECACHE_URLS = [
  '/home.html',
  '/fresher.html',
  '/pwbd.html',
  '/company.html',
  '/volunteer.html',
  '/aboutus.html',
  '/faq.html',
  '/contactus.html',
  '/disclaimer.html',
  '/download.html',
  '/donor.html',
  '/style.css',
  '/manifest.json',
  '/images/mumbai121_logo.png',
  '/images/icon-192.png',
  '/images/icon-512.png'
];

// ── INSTALL: Pre-cache all core assets ──────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Mumbai121 Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core assets');
      // Use addAll but don't fail the whole install if one optional asset is missing
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Some assets could not be pre-cached:', err);
      });
    })
  );
  // Activate immediately without waiting for old SW to stop
  self.skipWaiting();
});

// ── ACTIVATE: Clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Mumbai121 Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ── FETCH: Serve from cache, fall back to network ───────────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (CDN fonts, Font Awesome, etc.)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Skip API/backend calls (Flask endpoints)
  if (url.pathname.startsWith('/contact') ||
      url.pathname.startsWith('/fresher') && url.pathname.includes('submit') ||
      url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache; also refresh cache in the background (stale-while-revalidate)
        const networkFetch = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => { /* network unavailable — cached version already served */ });

        return cachedResponse;
      }

      // Not in cache — fetch from network and cache it
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Offline fallback — return home page from cache
        return caches.match('/home.html');
      });
    })
  );
});