const CACHE_NAME = 'lifeos-cache-v22';
const ASSETS = [
  './index.html',
  './style.css',
  './core/config.js',
  './core/router.js',
  './services/authService.js',
  './services/supabaseService.js',
  './services/storageService.js',
  './services/syncService.js',
  './services/notificationService.js',
  './services/validationService.js',
  './services/budgetService.js',
  './services/financeService.js',
  './services/chartService.js',
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
    fetch(e.request)
      .then((response) => {
        // Cache new assets or updates on the fly
        if (response.status === 200 && e.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline or network failed: Fallback to Cache
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback for offline if page requested is main index
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

