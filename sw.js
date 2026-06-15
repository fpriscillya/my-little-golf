/* ============================================================
   MY LITTLE GOLF: Service Worker
   Cache-first for static assets, network-first for everything else.
   Version bump CACHE_NAME to force update when files change.
   ============================================================ */

const CACHE_NAME = "my-little-golf-v1";

const STATIC_ASSETS = [
  "/index.html",
  "/green-card.html",
  "/manifest.json",
  "/assets/style.css",
  "/assets/app.js",
  "/assets/green-card.js",
  "/assets/fox.jpg",
];

/* Install: cache all static assets */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* Activate: remove old caches */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* Fetch: cache-first for static, network-first for external */
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests and known static paths.
  // Let MediaPipe CDN and API calls go straight to the network.
  const isStatic = STATIC_ASSETS.some(path => url.pathname === path);

  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
  // All other requests (MediaPipe models, fonts, CDN) go to network directly.
});
