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
