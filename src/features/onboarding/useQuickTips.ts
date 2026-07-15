import { useCallback, useState } from "react";

/**
 * Local flag for the one-time in-app "find your way around" popup. It is stored
 * per-device (not in the profile) because the tips point at on-screen controls —
 * a device-local hint, distinct from the account-level onboarding carousel.
 */
const STORAGE_KEY = "lifetrack.quick-tips-seen";

function hasSeenQuickTips(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

/** Clear the flag so the quick-tips popup shows again (used by "Replay tour"). */
export function resetQuickTips(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures — the popup simply won't be re-shown.
  }
}

export function useQuickTips() {
  const [seen, setSeen] = useState(hasSeenQuickTips);

  const dismiss = useCallback(() => {
    setSeen(true);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Non-fatal — worst case the popup reappears on the next visit.
    }
  }, []);

  return { seen, dismiss };
}
