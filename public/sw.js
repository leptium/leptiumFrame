/**
 * Service Worker — FenixFrame Digital Canvas OS
 * Offline-first architecture with Stale-While-Revalidate caching.
 * Navigation-safe: Network-first for HTML documents to prevent ERR_FAILED on redirects.
 * Fail-safe: Resilient Cache-First for images with offline fallback.
 */

const CACHE_NAME = 'fenixframe-v9';
const PRECACHE_ASSETS = [
  '/',
  '/app',
  '/app/',
  '/app.html',
  '/app/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/logo.svg',
  '/assets/demo/catalog.js',
  '/assets/demo/demo_01.jpg',
  '/assets/demo/demo_02.jpg',
  '/assets/demo/demo_03.jpg',
  '/assets/demo/demo_04.jpg',
  '/assets/demo/demo_05.jpg',
  '/assets/demo/demo_06.jpg',
  '/assets/demo/demo_07.jpg',
  '/assets/demo/demo_08.jpg',
  '/assets/demo/demo_09.jpg',
  '/assets/demo/demo_10.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn('[SW] Precache skip for asset:', asset, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Omitir peticiones a APIs de pago, telemetria o endpoints dinamicos
  if (event.request.url.includes('api.lemonsqueezy.com') || url.pathname.startsWith('/api/')) {
    return;
  }

  // 1. Navegacion de paginas HTML (Documentos): Network-First con fallback resiliente offline
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request, { redirect: 'follow' }).catch(async () => {
        // Si el usuario navegó al Home (Landing Page)
        if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '') {
          return (
            (await caches.match('/index.html')) ||
            (await caches.match('/')) ||
            (await caches.match('/app'))
          );
        }
        // Si el usuario navegó a la App del marco
        return (
          (await caches.match('/app')) ||
          (await caches.match('/app/')) ||
          (await caches.match('/app.html')) ||
          (await caches.match('/app/index.html')) ||
          (await caches.match('/index.html')) ||
          (await caches.match('/'))
        );
      })
    );
    return;
  }


  // 2. Estrategia Cache-First blindada para imagenes (locales y de red remota/CDNs)
  const isImageRequest =
    event.request.destination === 'image' ||
    /\.(jpe?g|png|webp|gif|svg|avif)($|\?)/i.test(url.pathname);

  if (isImageRequest) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Servir inmediatamente la version en cache
          // Revalidar en segundo plano de manera no bloqueante si hay conexion
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {
              // Falla de red silenciosa: el usuario ya tiene la version cacheada
            });
          return cachedResponse;
        }

        // Si no esta en cache, intentar descargar de la red
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(async (fetchError) => {
            console.warn('[SW] Red intermitente en descarga de imagen, activando fallback:', event.request.url, fetchError);

            // Intentar responder con alguna foto de muestra precacheada
            const fallbackSample =
              (await caches.match('/assets/demo/demo_01.jpg')) ||
              (await caches.match('/assets/demo/demo_02.jpg')) ||
              (await caches.match('/assets/demo/demo_03.jpg'));
            if (fallbackSample) {
              return fallbackSample;
            }

            // Fallback vectorial minimo para evitar errores net::ERR_ y permitir continuidad
            const svgPlaceholder =
              '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
              '<rect width="800" height="600" fill="#020408"/>' +
              '<text x="400" y="300" fill="#ffd60a" font-family="-apple-system, sans-serif" font-size="20" font-weight="600" text-anchor="middle">' +
              'FenixFrame Canvas' +
              '</text></svg>';

            return new Response(svgPlaceholder, {
              status: 200,
              headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' }
            });
          });
      })
    );
    return;
  }

  // Omitir peticiones externas que no sean de imagen o documento
  if (url.origin !== location.origin) {
    return;
  }

  // 3. Recursos estaticos locales (JS, CSS, fuentes): Cache-First con Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Si falla un recurso no esencial sin cache, retornar respuesta vacia limpia
          return new Response('', { status: 408, statusText: 'Request Timed Out' });
        });
    })
  );
});

