// Veda Service Worker — v2.2
const CACHE_NAME      = 'veda-shell-v15';
const RUNTIME_CACHE   = 'veda-runtime-v15';
const OFFLINE_URL     = '/offline.html';
// App shell — files to cache immediately on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/image_1.png',
  '/image_2.png',
  '/offline.html'
];
// ── INSTALL ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});
// ── ACTIVATE ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});
// ── FETCH ─────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  // Skip non-GET and cross-origin requests (Firebase, Google APIs etc)
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin) return;
  // Navigation requests — network first, fallback to shell/offline.
  // cache:'no-store' forces this fetch to bypass the browser's/CDN's own HTTP
  // cache and hit the origin directly — otherwise "network first" can still
  // silently resolve to a stale cached response before it ever reaches here,
  // which then gets re-cached, making the app look stuck on an old version.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          // Cache a fresh copy
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request)
            .then(cached => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }
  // Static assets — cache first, then network
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|css)$/)
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(request, clone));
          return response;
        });
      })
    );
    return;
  }
  // Everything else — network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
// ── PUSH NOTIFICATIONS (ready for future use) ─────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Veda', {
      body:    data.body    || 'Time to study! 📚',
      icon:    '/image_2.png',
      badge:   '/image_2.png',
      vibrate: [100, 50, 100],
      data:    { url: data.url || '/' }
    })
  );
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
