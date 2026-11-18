// Remembers the last in-app screen so an installed PWA that the OS discarded in
// the background reopens where the user left off instead of at the start page.

const KEY = "lifetrack.last-route";
const IGNORED = new Set(["/", "/auth", "/reset-password"]);

export function saveLastRoute(pathname: string, search = ""): void {
  if (IGNORED.has(pathname)) return;
  try {
    window.localStorage.setItem(KEY, pathname + search);
  } catch {
    // Storage unavailable — falling back to the default landing route is fine.
  }
}

export function readLastRoute(isAdmin: boolean): string | null {
  try {
    const stored = window.localStorage.getItem(KEY);
    if (!stored || !stored.startsWith("/") || stored.startsWith("//")) return null;
    const pathname = stored.split(/[?#]/)[0];
    if (IGNORED.has(pathname)) return null;
    if (pathname.startsWith("/admin") && !isAdmin) return null;
    return stored;
  } catch {
    return null;
  }
}
