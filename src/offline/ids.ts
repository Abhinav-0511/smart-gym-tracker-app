/**
 * Client-side identifier generation for offline-first records.
 *
 * Offline creates must have a stable primary key *before* they ever reach
 * Supabase, so the sync engine can push them idempotently and the UI can
 * reference them immediately. We use the platform-native UUID generator to
 * avoid an extra dependency; all supported PWA browsers implement it.
 */

/** Generate an RFC-4122 v4 UUID suitable for use as a primary key. */
export function newId(): string {
  // `crypto.randomUUID` is available in every browser that can install a PWA
  // and in modern Node (test env). Fall back defensively for exotic runtimes.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Non-cryptographic fallback — only reached in environments without WebCrypto.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Current instant as an ISO-8601 string — the canonical `updated_at` format. */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * A *deterministic* UUID derived from a seed string: the same seed always yields
 * the same id, on every device. Used for rows whose identity is a natural
 * composite key rather than a random id — e.g. a habit completion is uniquely
 * `(habit_id, log_date)`, so seeding the id from those means two devices marking
 * the same day complete produce the identical row and converge without
 * duplicates. Uses cyrb128 (a fast 128-bit non-cryptographic hash) formatted as
 * a UUID; collision risk across distinct seeds is negligible for this purpose.
 */
export function deterministicId(seed: string): string {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < seed.length; i++) {
    const k = seed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  const h = hex(h1) + hex(h2) + hex(h3) + hex(h4);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}
