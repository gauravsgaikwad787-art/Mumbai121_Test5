// Mumbai121 Service Worker
// Increment version string whenever you deploy updates to bust old caches
const CACHE_NAME = 'mumbai121-v2';

// Derive base path automatically — works on GitHub Pages subdirectories
// e.g. https://gauravsgaikwad787-art.github.io/your-repo-name/
const BASE_PATH = self.location.pathname.replace('/service-worker.js', '');

const PRECACHE_URLS = [
  `${BASE_PATH}/home.html`,
  `${BASE_PATH}/fresher.html`,
  `${BASE_PATH}/pwbd.html`,
  `${BASE_PATH}/company.html`,
  `${BASE_PATH}/volunteer.html`,
  `${BASE_PATH}/aboutus.html`,
  `${BASE_PATH}/faq.html`,
  `${BASE_PATH}/contactus.html`,
  `${BASE_PATH}/disclaimer.html`,
  `${BASE_PATH}/download.html`,
  `${BASE_PATH}/donor.html`,
  `${BASE_PATH}/style.css`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/images/mumbai121_logo.png`,
  `${BASE_PATH}/images/icon-192.png`,
  `${BASE_PATH}/images/icon-512.png`,
];

// ── INSTALL ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Some assets could not be pre-cached:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: Delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: Cache-first with network fallback ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Skip cross-origin (Google Fonts, Font Awesome CDN, etc.)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Stale-while-revalidate: serve instantly, refresh in background
      if (cached) {
        fetch(event.request)
          .then((fresh) => {
            if (fresh && fresh.status === 200) {
              caches.open(CACHE_NAME).then((c) => c.put(event.request, fresh));
            }
          })
          .catch(() => {});
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          caches.open(CACHE_NAME).then((c) =>
            c.put(event.request, response.clone())
          );
          return response;
        })
        .catch(() => caches.match(`${BASE_PATH}/home.html`));
    })
  );
});
