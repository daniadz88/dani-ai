// sw.js — Dani AI Service Worker
const CACHE_NAME = "dani-ai-v2";
const STATIC_ASSETS = ["/", "/index.html", "/favicon.svg", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ✅ Skip chrome-extension, non-http(s) schemes — ini fix untuk error cache
  if (!url.protocol.startsWith("http")) return;

  // API calls — selalu network, jangan cache
  if (url.pathname.startsWith("/api")) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets — network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          // Hanya cache same-origin atau basic responses
          if (
            response.type === "basic" ||
            url.origin === self.location.origin
          ) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return caches.match("/index.html");
        });
      })
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || "Dani AI", {
    body: data.body || "",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
  });
});