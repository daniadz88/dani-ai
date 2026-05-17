// vite.config.ts
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {VitePWA} from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            // ← KUNCI auto-update: prompt = tanya user, autoUpdate = langsung update
            registerType: "autoUpdate",

            // Update setiap kali user buka app dan ada versi baru di server
            workbox: {
                // Langsung claim semua client tanpa tunggu reload
                clientsClaim: true,
                skipWaiting: true,

                // Cache strategy
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

                // Network-first untuk API calls — jangan cache
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\/api\/.*/i,
                        handler: "NetworkOnly",
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts",
                            expiration: {maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365},
                        },
                    },
                ],
            },

            // Manifest untuk install di HP
            manifest: {
                name: "Dani AI — Security Terminal",
                short_name: "Dani AI",
                description: "AI-powered security research & educational assistant",
                theme_color: "#0c0e12",
                background_color: "#0c0e12",
                display: "standalone",
                orientation: "portrait",
                scope: "/",
                start_url: "/",
                icons: [
                    {src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable"},
                    {src: "/icon-192.png", sizes: "192x192", type: "image/png"},
                    {src: "/icon-512.png", sizes: "512x512", type: "image/png"},
                ],
            },

            // Dev mode — aktifkan PWA di development juga
            devOptions: {
                enabled: false, // set true kalau mau test SW di localhost
            },
        }),
    ],

    server: {
        host: "0.0.0.0",
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
            },
        },
    },
});
