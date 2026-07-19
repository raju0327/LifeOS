const CACHE_NAME = 'lifeos-cache-v10';
const ASSETS = [
  './index.html',
  './style.css',
  './js/app.js',
  './js/user.js',
  './js/productivity.js',
  './js/notes.js',
  './js/finance.js',
  './js/health.js',
  './js/medicine.js',
  './js/habits.js',
  './js/personal.js',
  './js/lifestyle.js',
  './js/career.js',
  './js/ai.js',
  './js/analytics.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
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
  // Completely bypass external cross-origin requests (like Supabase API database calls)
  if (!e.request.url.startsWith(self.location.origin)) {
    return; // Let the browser handle these directly via the network stack!
  }

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

