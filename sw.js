const CACHE = "bakery-calc-v24";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./splash.svg",
  "./menu-bg.jpg",
  "./app.js",
  "./xlsx-import.js",
  "./export-docs.js",
  "./vendor/xlsx.full.min.js",
  "./vendor/pdfmake.min.js",
  "./vendor/vfs_fonts.js",
  "./vendor/menu-font.js",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icons/favicon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Сеть с фолбэком на кеш: обновления подтягиваются, офлайн работает.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
