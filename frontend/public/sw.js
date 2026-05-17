// sw.js — Dani AI Service Worker
const CACHE_NAME = "dani-ai-v1";
const STATIC_ASSETS = ["/", "/index.html", "/favicon.svg", "/manifest.json"];

// Install — cache static assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
        .keys()
        .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
    );
    self.clients.claim();
});

// Fetch — network first, fallback ke cache
self.addEventListener("fetch", (event) => {
    const {request} = event;
    const url = new URL(request.url);

    // API calls — selalu network, jangan cache
    if (url.pathname.startsWith("/api")) {
        event.respondWith(fetch(request));
        return;
    }

    // Static assets — network first, cache fallback
    event.respondWith(
        fetch(request)
        .then((response) => {
            // Cache response baru
            if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });
            }
            return response;
        })
        .catch(() => {
            // Kalau offline, ambil dari cache
            return caches.match(request).then((cached) => {
                if (cached) return cached;
                // Fallback ke index.html untuk SPA routing
                return caches.match("/index.html");
            });
        })
    );
});

// Push notification support (opsional, buat nanti)
self.addEventListener("push", (event) => {
    if (!event.data) return;
    const data = event.data.json();
    self.registration.showNotification(data.title || "Dani AI", {
        body: data.body || "",
        icon: "/favicon.svg",
        badge: "/favicon.svg",
    });
});
