const CACHE_NAME = 'studio-akl-v1';

// Aset-aset inti yang di-cache saat instalasi
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: pre-cache aset inti
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Navigasi halaman  → Network-First (agar selalu fresh, fallback ke cache)
// - Aset statis       → Cache-First  (cepat, fallback ke network)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Hanya tangani request dari origin yang sama (skip cross-origin seperti analytics, dll)
  if (url.origin !== self.location.origin) return;

  // Skip API routes & Next.js internals — selalu ke network
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/_vercel/')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    // Network-First untuk navigasi
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
  } else {
    // Cache-First untuk aset statis
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
  }
});

