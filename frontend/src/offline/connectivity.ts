import { env } from "@/config/env";

/**
 * Robust connectivity detection.
 *
 * `navigator.onLine` only tells us whether the OS has *a* network interface —
 * it lies constantly (captive portals, VPNs, "connected, no internet"). So we
 * treat it as a fast negative signal only and confirm reachability with a
 * lightweight heartbeat against Supabase's auth health endpoint, which is
 * unauthenticated, tiny, and CORS-friendly.
 *
 * Exposed states:
 *  - `online`       heartbeat succeeded with acceptable latency
 *  - `poor`         heartbeat succeeded but slowly (sync should be conservative)
 *  - `offline`      no reachable network / heartbeat failed
 *  - `reconnecting` we saw a network-return signal and are re-verifying
 */
export type ConnectivityState = "online" | "offline" | "poor" | "reconnecting";

/** Heartbeat slower than this (ms) but still successful ⇒ "poor". */
const POOR_LATENCY_MS = 2500;
/** Abort a heartbeat that takes longer than this. */
const HEARTBEAT_TIMEOUT_MS = 5000;
/** Poll cadence while healthy. */
const HEALTHY_INTERVAL_MS = 30_000;
/** Faster poll while we believe we're offline, to notice a return quickly. */
const DEGRADED_INTERVAL_MS = 5_000;

type Listener = (state: ConnectivityState) => void;

class ConnectivityService {
  private state: ConnectivityState = "offline";
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private inFlight = false;
  private readonly healthUrl = `${env.supabaseUrl}/auth/v1/health`;

  /** Current best-known connectivity state (synchronous). */
  getState(): ConnectivityState {
    return this.state;
  }

  /** `true` when the network is usable for sync (online or merely poor). */
  isReachable(): boolean {
    return this.state === "online" || this.state === "poor";
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.start();
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Begin heartbeats and OS-event listeners. Idempotent. */
  start(): void {
    if (this.started) return;
    this.started = true;

    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleBrowserOnline);
      window.addEventListener("offline", this.handleBrowserOffline);
      document.addEventListener("visibilitychange", this.handleVisibility);
    }

    // Seed initial state from the cheap signal, then verify.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.setState("offline");
    } else {
      this.setState("reconnecting");
    }
    void this.checkNow();
  }

  stop(): void {
    this.started = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleBrowserOnline);
      window.removeEventListener("offline", this.handleBrowserOffline);
      document.removeEventListener("visibilitychange", this.handleVisibility);
    }
  }

  /** Force an immediate heartbeat (e.g. right before a sync attempt). */
  async checkNow(): Promise<ConnectivityState> {
    if (this.inFlight) return this.state;
    this.inFlight = true;
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        this.setState("offline");
        return this.state;
      }
      const latency = await this.heartbeat();
      if (latency === null) {
        this.setState("offline");
      } else if (latency > POOR_LATENCY_MS) {
        this.setState("poor");
      } else {
        this.setState("online");
      }
      return this.state;
    } finally {
      this.inFlight = false;
      this.scheduleNext();
    }
  }

  /** @returns round-trip latency in ms, or `null` if unreachable. */
  private async heartbeat(): Promise<number | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT_MS);
    const startedAt = performance.now();
    try {
      const response = await fetch(this.healthUrl, {
        method: "GET",
        headers: { apikey: env.supabaseAnonKey },
        signal: controller.signal,
        cache: "no-store",
      });
      // Any HTTP answer (even 4xx) proves the server is reachable.
      return response ? performance.now() - startedAt : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private scheduleNext(): void {
    if (!this.started) return;
    if (this.timer) clearTimeout(this.timer);
    const delay = this.isReachable() ? HEALTHY_INTERVAL_MS : DEGRADED_INTERVAL_MS;
    this.timer = setTimeout(() => void this.checkNow(), delay);
  }

  private handleBrowserOnline = (): void => {
    this.setState("reconnecting");
    void this.checkNow();
  };

  private handleBrowserOffline = (): void => {
    this.setState("offline");
    this.scheduleNext();
  };

  private handleVisibility = (): void => {
    if (document.visibilityState === "visible") void this.checkNow();
  };

  private setState(next: ConnectivityState): void {
    if (this.state === next) return;
    this.state = next;
    for (const listener of this.listeners) listener(next);
  }
}

/** App-wide singleton. Starts lazily on first subscription. */
export const connectivity = new ConnectivityService();
