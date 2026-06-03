/* Service worker mínimo para PWA — Estadísticas Argentinas.
 *
 * Objetivos:
 *  - Hacer la app instalable (requiere un SW con handler de fetch).
 *  - Dar un arranque rápido y un fallback offline para navegación.
 *
 * Principios (app de datos en vivo → nada de servir cotizaciones viejas):
 *  - Navegación (documentos): network-first, cae a caché y luego a /offline.
 *  - Estáticos del build (_next/static, fuentes, branding): cache-first.
 *  - /api/* y todo lo demás: network-only (sin caché).
 *
 * Para invalidar la caché vieja, subir CACHE_VERSION.
 */
const CACHE_VERSION = "v1";
const CACHE = `ea-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/branding/") ||
    /\.(?:css|js|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // CDN/externos: dejar pasar
  if (url.pathname.startsWith("/api/")) return; // datos en vivo: network-only

  // Navegación: network-first con fallback offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)),
        ),
    );
    return;
  }

  // Estáticos: cache-first con revalidación en segundo plano.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
