## Goal

Make Arogya Saathi a true offline-first PWA so ASHA workers can install it once on a phone, then open and use the full app (input → triage → result → history → language switch) with zero connectivity. Only AI simplification stays online.

## Important caveats (per Lovable PWA guidance)

- Service workers are intentionally **disabled in the Lovable preview iframe and on `*.lovableproject.com` / `id-preview--*` hosts**. Offline behavior will only be testable on the **published site** (`saathi-care-triage.lovable.app`) or after "Add to Home Screen" on a real device. This is required to avoid the editor preview serving a stale shell.
- We will use a **NetworkFirst** strategy for HTML navigations and **CacheFirst (with revalidation)** for static assets. We never use cache-first on HTML — that locks devices to a stale build forever.
- We will not use `selfDestroying`. We will ship a kill-switch-friendly registration so future cleanup is possible.

## Changes

### 1. Add PWA tooling

- Add dependency: `vite-plugin-pwa` (+ `workbox-window`).
- Extend `vite.config.ts` to pass `vite: { plugins: [VitePWA({...})] }` through `@lovable.dev/vite-tanstack-config`'s `defineConfig`.

VitePWA config:
- `registerType: "autoUpdate"`
- `devOptions.enabled: false` (no SW in dev/preview)
- `injectRegister: null` (we register manually with the iframe/preview guard)
- `workbox`:
  - `globPatterns`: `**/*.{js,css,html,svg,woff2,json,webmanifest}` — precaches JS bundles, CSS, route HTML, icons, manifest, and the bundled rule JSON / dictionary chunks
  - `navigateFallback: "/"` with `navigateFallbackDenylist: [/^\/api\//, /^\/~/, /^\/_/]`
  - `runtimeCaching`:
    - HTML navigations → `NetworkFirst`, 3s timeout, cache `html`
    - Same-origin static (`script|style|image|font`) → `StaleWhileRevalidate`, cache `assets`
    - `ai.gateway.lovable.dev` → `NetworkOnly` (never cache AI)
  - `cleanupOutdatedCaches: true`

### 2. Manual SW registration with iframe/preview guard

New file `src/pwa/register-sw.ts`:
- Only runs in browser.
- Skips registration if `window.self !== window.top` (iframe) OR hostname includes `id-preview--` / `lovableproject.com`.
- In those skipped cases, also unregister any existing SW (cleanup safety).
- Otherwise calls `registerSW({ immediate: true })` from `virtual:pwa-register`.
- Imported once from `src/router.tsx` (client-only via `if (typeof window !== "undefined")`).

### 3. Manifest + icons (installable / splash)

Update `public/manifest.webmanifest`:
- Keep existing `name`, `short_name`, `theme_color`, `background_color`, `display: "standalone"`.
- Add `lang: "en"`, `dir: "ltr"`, `orientation: "portrait"`, `categories: ["health", "medical"]`.
- Replace single icon with proper sizes: `192x192`, `512x512` (PNG, `purpose: "any"`) and one `512x512` `purpose: "maskable"`. Keep the current SVG as an additional `any` entry. PNGs will be generated from the existing teal stethoscope mark and placed in `public/icons/`.
- Add `apple-touch-icon` link in root head for iOS install/splash.

### 4. Offline-aware UI (graceful AI degradation)

- `src/store/app.ts`: add `online: boolean` plus `setOnline`. Initialize from `navigator.onLine`; subscribe to `online`/`offline` events once (in `AppShell`'s existing effect, push state into store instead of local state).
- `src/routes/result.tsx`:
  - Read `online` from store.
  - When offline: disable the "Explain in Simple Language" button and show a small inline notice: **"AI simplification needs internet. Triage result is fully available offline."** (translated via `dict.ts`).
  - All other result content (severity, reasoning, warning signs, recommended action, history save) continues to work.
- `src/components/AppShell.tsx`: existing online/offline badge stays; just sourced from the shared store now.
- `src/i18n/dict.ts`: add keys `ai_offline_notice`, `ai_offline_short` in en/hi/kn.

### 5. Offline route fallback

- Precaching all built route HTML + `navigateFallback: "/"` means navigating to `/`, `/history`, or any client route works offline.
- IndexedDB (`src/storage/db.ts`) is already client-side and works offline — no change.
- Rule JSON files are imported at build time and bundled into the JS chunks, so they are precached automatically. No runtime fetch.
- `src/i18n/dict.ts` is a static module — already bundled and precached.

### 6. Documentation note for the user

Add a short comment block at the top of `src/pwa/register-sw.ts` explaining:
- SW only activates in the published deployment (or installed PWA), never in the Lovable editor preview.
- To test offline: open the published URL on a phone, install via "Add to Home Screen", switch off Wi-Fi/data, reopen — input/triage/result/history/language must all work; AI button shows offline notice.

## Out of scope (explicitly preserved)

- Deterministic engine (`src/engine/*`), rule JSON, IndexedDB schema, routing, language system, server function for AI — all unchanged.

## Files

**New**
- `src/pwa/register-sw.ts`
- `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-512-maskable.png`

**Edited**
- `package.json` (add `vite-plugin-pwa`, `workbox-window`)
- `vite.config.ts` (wire VitePWA via `defineConfig({ vite: { plugins: [...] } })`)
- `public/manifest.webmanifest` (icon set, extra metadata)
- `src/routes/__root.tsx` (apple-touch-icon link)
- `src/router.tsx` (one-time SW register import, browser-guarded)
- `src/store/app.ts` (online state)
- `src/components/AppShell.tsx` (use shared online state)
- `src/routes/result.tsx` (offline-aware AI button + notice)
- `src/i18n/dict.ts` (offline notice strings in en/hi/kn)

## Validation flow

After implementation, verify on the **published URL**:
1. Open on phone, let it fully load.
2. "Add to Home Screen" → confirm icon + splash use the teal stethoscope.
3. Enable airplane mode.
4. Close and relaunch the installed app.
5. Confirm: form loads, can submit, result page renders with reasoning + warning signs, history page lists prior records, language switch updates UI, AI button shows offline notice instead of calling.
6. Re-enable internet → AI button works again.
