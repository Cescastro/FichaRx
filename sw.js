// Service Worker — Manual de medicamentos FO-SF-20
const CACHE_NAME = 'manual-fosf20-v2';
const ASSETS = [
  './',
  'index.html',
  'dataset_final.json',
  'manifest.webmanifest',
  'css/styles.css',
  'js/app.js',
  'js/search.js',
  'js/render.js',
  'js/ficha.js',
  'js/history.js',
  'js/utils.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
        return res;
      }).catch(() => caches.match('index.html'));
    })
  );
});
