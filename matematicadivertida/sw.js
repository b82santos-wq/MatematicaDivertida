const CACHE = "matematica-divertida-v25";
const PRECACHE = [
  "/matematicadivertida/", 
  "/matematicadivertida/manifest.json", 
  "/matematicadivertida/icon-512.png", 
  "/matematicadivertida/favicon.svg", 
  "/matematicadivertida/opengraph.jpg"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/") || url.pathname === "/api") return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("/matematicadivertida/").then(r => r || caches.match(req)))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
