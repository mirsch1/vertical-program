var _a, _b;
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
// BASE_PATH=/vertical-program/ for GitHub Pages; "/" locally.
var base = ((_b = (_a = globalThis.process) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.BASE_PATH) || "/";
export default defineConfig({
    base: base,
    // Allow access via cloudflared quick tunnels for iPhone testing (personal single-user app).
    server: { allowedHosts: true },
    preview: { allowedHosts: true },
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["apple-touch-icon.png"],
            manifest: {
                name: "Vertical Tracker",
                short_name: "Vertical",
                description: "Vertical jump training tracker: 17-week program, logs and analysis",
                theme_color: "#0a0a0f",
                background_color: "#0a0a0f",
                display: "standalone",
                orientation: "portrait",
                start_url: base,
                scope: base,
                icons: [
                    { src: "icon-192.png", sizes: "192x192", type: "image/png" },
                    { src: "icon-512.png", sizes: "512x512", type: "image/png" },
                    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
                // Cache Google Fonts after first load so the app is fully offline.
                runtimeCaching: [
                    { urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i, handler: "StaleWhileRevalidate", options: { cacheName: "google-fonts-css", expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 365 } } },
                    { urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i, handler: "CacheFirst", options: { cacheName: "google-fonts-files", expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } } },
                ],
            },
        }),
    ],
});
