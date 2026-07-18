import { registerSW } from "virtual:pwa-register";

/**
 * Service-worker registration.
 *
 * We register explicitly (rather than via the plugin's auto-injected snippet)
 * so bootstrapping lives in one place we control. `autoUpdate` means a freshly
 * deployed version installs and activates in the background; because all durable
 * state lives in IndexedDB/Supabase — never in-memory only — silently applying
 * the update on the next navigation is safe and keeps sync "invisible".
 */
export function registerServiceWorker(): void {
  // No-op in dev (SW disabled) and in environments without SW support.
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      // Periodically check for a new deployment while the app stays open, so a
      // long-lived installed session still picks up updates without a manual
      // restart. Hourly is frequent enough without being chatty.
      if (!registration) return;
      setInterval(
        () => {
          void registration.update();
        },
        60 * 60 * 1000,
      );
    },
    onRegisterError(error) {
      // Registration failure must never break the app — it just means no
      // offline shell this session.
      console.error("[pwa] service worker registration failed", error);
    },
  });
}
