/**
 * Generate a v4 UUID that also works outside secure contexts.
 *
 * `crypto.randomUUID()` is only defined in a secure context (HTTPS or
 * `localhost`). When the app is opened over plain HTTP on a LAN IP — common when
 * testing on a phone, e.g. `http://192.168.x.x:8080` — it is `undefined` and
 * throws "crypto.randomUUID is not a function". We fall back to
 * `crypto.getRandomValues` (available in insecure contexts too) and, as a last
 * resort, `Math.random`. The output is always 36 chars of lowercase hex and
 * dashes, so it still matches storage filename policies like `^[0-9a-f-]{36}$`.
 */
export function generateUuid(): string {
  const cryptoObj: Crypto | undefined = globalThis.crypto;

  if (typeof cryptoObj?.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }

  if (typeof cryptoObj?.getRandomValues === "function") {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return (
      `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-` +
      `${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`
    );
  }

  // Non-cryptographic last resort — still unique enough for object naming.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
