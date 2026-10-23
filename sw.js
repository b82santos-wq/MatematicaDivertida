const CACHE = "matematica-divertida-v25";
const PRECACHE = ["/", "/manifest.json", "/icon-512.png", "/favicon.svg", "/opengraph.jpg"];

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

  // Só intercetamos pedidos ao próprio site — scripts de terceiros (anúncios,
  // fontes) seguem o comportamento nativo do navegador e falham silenciosamente
  // quando offline, sem quebrar o jogo.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API (carteira, estado de faturação, compras): nunca em cache — respostas
  // privadas e dinâmicas vão sempre direto à rede.
  if (url.pathname.startsWith("/api/") || url.pathname === "/api") return;

  // Navegações (abrir a app / mudar de ecrã): tenta a rede, mas cai sempre
  // para a página principal em cache se estiver offline ou a rede falhar.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("/").then(r => r || caches.match(req)))
    );
    return;
  }

  // Restantes recursos do site (JS/CSS/imagens): cache-first com atualização
  // em segundo plano, para que o jogo abra instantaneamente mesmo offline.
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
