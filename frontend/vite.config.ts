import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {VitePWA} from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png"],
            manifest: {
                name: "Dani AI — Security Terminal",
                short_name: "Dani AI",
                description: "Security research assistant by daniadz88",
                start_url: "/",
                display: "standalone",
                orientation: "portrait-primary",
                background_color: "#0d0f14",
                theme_color: "#0d0f14",
                categories: ["productivity", "utilities"],
                icons: [
                    {
                        src: "/favicon.svg",
                        sizes: "any",
                        type: "image/svg+xml",
                        purpose: "any",
                    },
                    {
                        src: "/icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
                shortcuts: [
                    {
                        name: "Pentest Mode",
                        short_name: "Pentest",
                        description: "Open Dani AI in pentest profile",
                        url: "/?profile=pentest",
                        icons: [{src: "/favicon.svg", sizes: "any"}],
                    },
                    {
                        name: "OSINT Mode",
                        short_name: "OSINT",
                        description: "Open Dani AI in OSINT profile",
                        url: "/?profile=osint",
                        icons: [{src: "/favicon.svg", sizes: "any"}],
                    },
                ],
            },
            workbox: {
                // cache semua asset utama
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
                // network first untuk API calls, cache first untuk assets
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-cache",
                            expiration: {maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365},
                            cacheableResponse: {statuses: [0, 200]},
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "gstatic-fonts-cache",
                            expiration: {maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365},
                            cacheableResponse: {statuses: [0, 200]},
                        },
                    },
                    {
                        urlPattern: /\/api\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            networkTimeoutSeconds: 10,
                            expiration: {maxEntries: 50, maxAgeSeconds: 60 * 60},
                            cacheableResponse: {statuses: [0, 200]},
                        },
                    },
                ],
            },
            devOptions: {
                enabled: false, // matiin di dev biar ga ribet
            },
        }),
    ],
    server: {
        host: "0.0.0.0",
        port: 5173,
        proxy: {
            "/api": {
                target: process.env.VITE_API_URL || "http://localhost:3001",
                changeOrigin: true,
            },
        },
    },
});
