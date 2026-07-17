const CACHE_NAME = 'lifeos-cache-v1';
const ASSETS = [
  './index.html',
  './style.css',
  './js/app.js',
  './js/user.js',
  './js/productivity.js',
  './js/notes.js',
  './js/finance.js',
  './js/health.js',
  './js/personal.js',
  './js/lifestyle.js',
  './js/career.js',
  './js/ai.js',
  './js/analytics.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // Fallback for offline if page requested is main index
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
