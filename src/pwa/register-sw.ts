/**
 * Service worker registration for Arogya Saathi.
 *
 * IMPORTANT — Lovable preview behavior:
 * The Lovable editor renders this app inside an iframe on `id-preview--*`
 * and `lovableproject.com` hosts. Registering a service worker there causes
 * stale builds and broken hot reloads, so we explicitly SKIP registration in
 * those contexts and proactively unregister any leftover SW.
 *
 * The PWA only activates on:
 *   - the published deployment (e.g. saathi-care-triage.lovable.app)
 *   - the installed PWA (Add to Home Screen) on a real device
 *
 * To validate offline behavior:
 *   1. Open the published URL on a phone, let it fully load.
 *   2. "Add to Home Screen" → confirm icon + splash.
 *   3. Enable airplane mode, close the app, relaunch.
 *   4. Form, triage, result, history, language switch all work.
 *      The AI button shows an "offline" notice instead of calling.
 */

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") || host.includes("lovableproject.com");

  if (isInIframe || isPreviewHost) {
    // Cleanup any previously registered SW so the editor preview never serves stale assets.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister().catch(() => {}));
    }).catch(() => {});
    return;
  }

  // Lazy-load the virtual module so dev/SSR builds without the plugin don't break.
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      // Plugin not present (e.g. dev without PWA) — silently no-op.
    });
}
