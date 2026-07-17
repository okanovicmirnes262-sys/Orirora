/* ORDIORA service worker — app-shell caching for installability + offline shell.
   Only same-origin GET requests are handled; Supabase (cross-origin) always
   goes straight to the network so data stays fresh. */
const CACHE = "ordiora-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Never touch non-GET or cross-origin (e.g. Supabase, fonts) requests.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Navigations: network-first, fall back to the cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("/index.html", net.clone());
        return net;
      } catch (e) {
        const cache = await caches.open(CACHE);
        return (await cache.match("/index.html")) || (await cache.match("/")) || Response.error();
      }
    })());
    return;
  }

  // Static assets (hashed, immutable): cache-first, then network.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const net = await fetch(req);
      if (net && net.ok && net.type === "basic") cache.put(req, net.clone());
      return net;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});
