/**
 * Service Worker — Sistema de Gestão do Inventário Anual SENAPPEN
 * Suporte a Progressive Web App (PWA), carregamento instantâneo e offline resiliente.
 */

const CACHE_NAME = 'senappen-inventario-v2.3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/styles.css',
  '/src/app.js',
  '/src/data.js',
  '/src/assets/logo-app.png',
  '/src/assets/logo-senappen.png',
  '/src/assets/icon-192.png',
  '/src/assets/icon-512.png',
  '/src/assets/apple-touch-icon.png',
  '/src/assets/favicon.svg',
  '/src/assets/favicon.png'
];

// Instalação do Service Worker e pré-cache dos assets essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pré-armazenando assets estáticos no cache');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Aviso no pre-cache de assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches obsoletas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removendo cache antiga:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições de rede
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Requisições de API (Vercel Serverless /api/ ou Google Apps Script) — SEMPRE direto da rede
  if (url.pathname.startsWith('/api/') || url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.warn('[SW] Falha de conexão na API:', err);
        return new Response(
          JSON.stringify({
            status: 'error',
            mensagem: 'Sem conexão com a internet no momento. Verifique sua rede e tente novamente.'
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 2. Requisições de recursos estáticos: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
