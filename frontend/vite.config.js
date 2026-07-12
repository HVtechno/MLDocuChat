import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "Foliq — your research library that thinks",
        short_name: "Foliq",
        description:
          "Ask across all your papers, not one at a time. A research library with cross-paper synthesis and exact citations.",
        theme_color: "#5b5bd6",
        background_color: "#faf9f6",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Cache the app shell for offline load; never cache API calls so
        // documents/answers are always fresh.
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/api/, /^\/auth/, /^\/documents/, /^\/chat\//, /^\/billing/, /^\/feedback/, /^\/admin\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin && /\.(png|svg|woff2|css|js)$/.test(url.pathname),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "foliq-assets" },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
