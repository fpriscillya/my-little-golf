/* ============================================================
   MY LITTLE GOLF: Service Worker
   Scoped to /my-little-golf/ for GitHub Pages subfolder hosting.
   Bump CACHE_NAME to force update when files change.
   ============================================================ */

const CACHE_NAME = "my-little-golf-v2";
const BASE = "/my-little-golf";

const STATIC_ASSETS = [
  `${BASE}/index.html`,
  `${BASE}/green-card.html`,
  `${BASE}/manifest.json`,
  `${BASE}/assets/style.css`,
  `${BASE}/assets/app.js`,
  `${BASE}/assets/green-card.js`,
  `${BASE}/assets/fox.jpg`,
  `${BASE}/assets/icon-192.png`,
  `${BASE}/assets/icon-512.png`,
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

/* Fetch: cache-first for our static files, network for everything else */
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const isOurAsset = STATIC_ASSETS.some(path => url.pathname === path);

  if (isOurAsset) {
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
  // MediaPipe models, Google Fonts, CDN requests go straight to network.
});
