import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Service worker + offline app shell. We reuse the hand-tuned
    // public/site.webmanifest (manifest: false) and let Workbox precache the
    // built shell so the installed PWA opens with no network. Supabase traffic
    // is intentionally NOT cached here — offline data comes from IndexedDB
    // (the offline data layer), never from a stale HTTP cache.
    VitePWA({
      registerType: "autoUpdate",
      // We manage the manifest by hand in public/site.webmanifest.
      manifest: false,
      injectRegister: null, // registration handled explicitly in src/offline/pwa.ts
      // Keep only lightweight branding in the precache; heavier content images
      // (e.g. Help Center screenshots) are cached on first view via the runtime
      // image rule below, so first install stays small and fast on mobile.
      includeAssets: ["favicon.ico", "robots.txt", "brand/**/*"],
      workbox: {
        // Precache the code shell only (JS/CSS/HTML/fonts/icons). `index.html`
        // is the offline navigation fallback so any client-side route renders
        // without the network. Content images are runtime-cached, not precached.
        globPatterns: ["**/*.{js,css,html,ico,woff,woff2}"],
        navigateFallback: "/index.html",
        // Never hijack Supabase or auth callbacks with the SPA shell.
        navigateFallbackDenylist: [/^\/api/, /supabase\.co/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Same-origin images/icons: serve instantly, refresh in background.
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin && request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "lifetrack-images",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Supabase REST/auth/storage: always hit the network. Offline reads
            // are served by IndexedDB, so we must never cache these responses.
            urlPattern: ({ url }) => url.hostname.endsWith("supabase.co"),
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: {
        // Keep the SW off during `vite dev` to avoid stale-cache confusion.
        enabled: false,
      },
    }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          query: ["@tanstack/react-query"],
          react: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
