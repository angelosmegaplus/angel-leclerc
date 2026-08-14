// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// Load all env vars into process.env for server-side code (server routes / server functions).
// The @lovable.dev/vite-tanstack-config plugin already loads VITE_* vars into client code;
// this separate call ensures non-VITE secrets (e.g., SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY)
// are available to server functions without leaking them into the client bundle.
const mode = process.env.NODE_ENV || "development";
const serverEnv = loadEnv(mode, process.cwd(), "");
Object.assign(process.env, serverEnv);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        devOptions: { enabled: false },
        filename: "sw.js",
        outDir: "dist/client",
        manifestFilename: "manifest.webmanifest",
        includeAssets: ["favicon.png", "icons/apple-touch-icon.png", "offline.html"],
        manifest: {
          name: "Angel OS IA — Angel Control Center",
          short_name: "Angel OS IA",
          description:
            "Centre de contrôle personnel, professionnel et journalistique d'Angel Leclerc.",
          lang: "fr",
          dir: "ltr",
          id: "/admin",
          start_url: "/admin",
          scope: "/",
          display: "standalone",
          orientation: "portrait-primary",
          background_color: "#F6F1E8",
          theme_color: "#181716",
          categories: ["productivity", "business", "news"],
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
            { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
          shortcuts: [
            { name: "Tableau de bord", short_name: "Dashboard", url: "/admin?tab=dashboard" },
            { name: "Studio / Journalisme", short_name: "Studio", url: "/admin?tab=studio" },
            { name: "Articles", short_name: "Articles", url: "/admin?tab=articles" },
            { name: "Connexions", short_name: "Connexions", url: "/admin?tab=connexions" },
          ],
        },
        workbox: {
          // Le gestionnaire de notifications vit dans un fichier séparé, jamais mis en cache.
          importScripts: ["/sw-push.js"],
          globPatterns: ["**/*.{js,css,woff2,svg,png,ico}"],
          globIgnores: ["**/sw-push.js"],
          navigateFallback: "/offline.html",
          navigateFallbackDenylist: [
            /^\/admin/,
            /^\/api\//,
            /^\/~oauth/,
            /^\/lovable\//,
          ],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              // Contenu privé et appels authentifiés : jamais de cache.
              urlPattern: ({ url }: { url: URL }) =>
                url.pathname.startsWith("/admin") ||
                url.pathname.startsWith("/api/") ||
                url.pathname.startsWith("/_serverFn") ||
                url.pathname.startsWith("/lovable/") ||
                url.pathname.startsWith("/~oauth"),
              handler: "NetworkOnly",
            },
            {
              // Pages publiques : toujours le réseau d'abord, jamais un vieux HTML.
              urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "alc-pages",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              urlPattern: ({ url, request }: { url: URL; request: Request }) =>
                url.origin === self.location.origin &&
                (request.destination === "script" ||
                  request.destination === "style" ||
                  request.destination === "font" ||
                  request.destination === "image"),
              handler: "CacheFirst",
              options: {
                cacheName: "alc-assets",
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
    // React Email's htmlparser2 needs entities v4.5.0; pin every import path to the hoisted copy.
    resolve: {
      alias: {
        "entities/lib/decode.js": path.resolve(process.cwd(), "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(process.cwd(), "node_modules/entities/lib/encode.js"),
        entities: path.resolve(process.cwd(), "node_modules/entities"),
      },
    },
  },
});
