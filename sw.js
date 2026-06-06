// Service Worker — FichaRx · Manual de medicamentos FO-SF-20
const CACHE_NAME = 'fichaRx-v6';
const ASSETS = [
  './',
  'index.html',
  'dataset_final.json',
  'manifest.webmanifest',
  'css/styles.css',
  'js/app.js',
  'js/utils/html.js',
  'js/utils/normalizer.js',
  'js/domain/Medicamento.js',
  'js/infrastructure/JsonMedicamentosRepository.js',
  'js/infrastructure/LocalStorageHistorialRepo.js',
  'js/application/BusquedaService.js',
  'js/application/commands/AbrirFichaCommand.js',
  'js/application/commands/BuscarCommand.js',
  'js/application/commands/CerrarFichaCommand.js',
  'js/presentation/AppController.js',
  'js/presentation/FichaBuilder.js',
  'js/presentation/FichaView.js',
  'js/presentation/ResultadosRenderer.js',
  'js/presentation/SectionFactory.js',
  'js/presentation/sections/SectionRenderer.js',
  'js/presentation/sections/AltoRiesgoSection.js',
  'js/presentation/sections/PresentacionesSection.js',
  'js/presentation/sections/MultidosisSection.js',
  'js/presentation/sections/HorarioVoSection.js',
  'js/presentation/sections/FuentesSection.js',
  'img/FichaRX_Logo.svg',
  'img/RxLogo.png',
  'img/fichaRxbanner.png',
];

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  globalThis.skipWaiting();
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  globalThis.clients.claim();
});

globalThis.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate';
  const isData = url.pathname.endsWith('.json');

  if (isNavigation || isData) {
    // Network First: garantiza contenido fresco en cada refresh.
    // Cae a caché solo si no hay red (modo offline).
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached ?? caches.match('index.html'))
        )
    );
  } else {
    // Cache First para assets estáticos (CSS, JS, imágenes).
    // Si no están en caché, los descarga y los guarda.
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
  }
});
