/**
 * Switcha Service Worker
 * Enables offline simulation, PWA installation, and ultra-fast asset caching on Laptop, Phone, and Tablet.
 */

const CACHE_NAME = 'switcha-pwa-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/simulator.css',
  './js/app.js',
  './js/engine/circuit-model.js',
  './js/engine/components.js',
  './js/engine/circuit-engine.js',
  './js/editor/schematic-canvas.js',
  './js/editor/grapher.js',
  './js/editor/circuit-library.js',
  './js/editor/instruments.js',
  './js/services/storage-service.js',
  './js/blocks/block-types.js',
  './js/blocks/block-engine.js',
  './js/blocks/block-canvas.js',
  './js/blocks/block-scope.js',
  './js/blocks/block-library.js',
  './js/code/code-engine.js',
  './js/code/code-plotter.js',
  './js/code/code-editor.js',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[Switcha SW] Cache addAll warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Switcha SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle http/https GET requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Network-first with cache fallback for instant updates and offline support
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
