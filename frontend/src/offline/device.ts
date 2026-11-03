import { newId } from "@/offline/ids";

/**
 * Stable per-install device identifier.
 *
 * Every queued mutation records the device that produced it so the sync engine
 * can reason about provenance (e.g. skip echoing a change back to its origin).
 * This is one of the few things we intentionally keep in `localStorage`: it is a
 * tiny, non-sensitive scalar that must survive even if IndexedDB is cleared, and
 * reading it must be synchronous during app bootstrap.
 */
const DEVICE_ID_KEY = "lifetrack.device_id";

let cachedDeviceId: string | null = null;

export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      cachedDeviceId = existing;
      return existing;
    }
    const created = newId();
    localStorage.setItem(DEVICE_ID_KEY, created);
    cachedDeviceId = created;
    return created;
  } catch {
    // localStorage unavailable (private mode / SSR) — fall back to an
    // in-memory id for the lifetime of this session.
    cachedDeviceId = cachedDeviceId ?? newId();
    return cachedDeviceId;
  }
}
