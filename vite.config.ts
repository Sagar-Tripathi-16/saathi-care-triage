// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null, // we register manually with iframe/preview guard
        devOptions: { enabled: false }, // never run SW in dev or Lovable preview
        includeAssets: [
          "icon.svg",
          "icons/icon-192.png",
          "icons/icon-512.png",
          "icons/icon-512-maskable.png",
        ],
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ["**/*.{js,css,html,svg,png,woff2,json,webmanifest,ico}"],
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/api\//, /^\/~/, /^\/_/],
          runtimeCaching: [
            {
              // HTML navigations: NetworkFirst so deploys propagate; falls back to cache offline
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "html-pages",
                networkTimeoutSeconds: 3,
              },
            },
            {
              // Static assets: SWR keeps app shell instantly available offline
              urlPattern: ({ request, sameOrigin }) =>
                sameOrigin &&
                ["script", "style", "image", "font"].includes(request.destination),
              handler: "StaleWhileRevalidate",
              options: { cacheName: "static-assets" },
            },
            {
              // AI gateway: never cache. Must always be fresh, and offline = unavailable.
              urlPattern: /^https:\/\/ai\.gateway\.lovable\.dev\//,
              handler: "NetworkOnly",
            },
          ],
        },
      }),
    ],
  },
});
