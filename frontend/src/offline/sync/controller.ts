import { db } from "@/offline/db";
import { connectivity } from "@/offline/connectivity";
import { nowIso } from "@/offline/ids";
import { pushItem } from "@/offline/sync/push";
import { META_KEYS } from "@/offline/types";

/**
 * Drains the durable sync queue to Supabase.
 *
 * Design goals (Phase 3 — a minimal but correct engine; Phase 4 adds pull,
 * background sync, and resumable interrupts on top of this same shape):
 *  - **Ordered replay.** Items are processed by ascending `seq` so an insert is
 *    always pushed before a later update/delete of the same row (causality).
 *  - **Single-flight.** A concurrency guard prevents two drains racing on a
 *    simultaneous reconnect; a coalesced re-run covers work that arrived mid-drain.
 *  - **Backoff.** A failed item is marked `failed` with an exponential
 *    `nextAttemptAt`; the drain stops at the first failure to preserve order and
 *    reschedules itself.
 *  - **Idempotent.** `pushItem` uses upsert/eq so retries never duplicate.
 */
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 60_000;

function backoffUntil(retryCount: number): string {
  const delay = Math.min(BACKOFF_BASE_MS * 2 ** (retryCount - 1), BACKOFF_MAX_MS);
  return new Date(Date.now() + delay).toISOString();
}

class SyncController {
  private started = false;
  private pushing = false;
  private coalesced = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  /** Begin reacting to connectivity; safe to call more than once. */
  start(): void {
    if (this.started) return;
    this.started = true;
    // Subscribing also boots the connectivity heartbeat. Whenever the network
    // becomes usable, attempt to flush anything queued.
    connectivity.subscribe((state) => {
      if (state === "online" || state === "poor") this.requestPush();
    });
    this.requestPush();
  }

  /** Fire-and-forget flush request (e.g. right after a local write). */
  requestPush(): void {
    void this.push();
  }

  /** Drain the queue. Resolves when this pass finishes (not when the queue empties). */
  async push(): Promise<void> {
    if (!connectivity.isReachable()) return;
    if (this.pushing) {
      this.coalesced = true;
      return;
    }
    this.pushing = true;
    try {
      const pending = await db.sync_queue
        .where("status")
        .anyOf("pending", "failed")
        .sortBy("seq");

      for (const item of pending) {
        if (item.seq === undefined) continue;
        // Respect backoff windows for previously-failed items.
        if (item.nextAttemptAt && item.nextAttemptAt > nowIso()) continue;
        if (!connectivity.isReachable()) break;

        try {
          await db.sync_queue.update(item.seq, { status: "syncing" });
          await pushItem(item);
          await db.sync_queue.delete(item.seq);
        } catch (error) {
          const retryCount = item.retryCount + 1;
          await db.sync_queue.update(item.seq, {
            status: "failed",
            retryCount,
            lastError: error instanceof Error ? error.message : String(error),
            nextAttemptAt: backoffUntil(retryCount),
          });
          // Stop at the first failure to preserve per-row ordering; the retry
          // timer (below) will resume the drain after the backoff elapses.
          break;
        }
      }
      // A fully-drained queue while reachable means everything is up to date;
      // record it so the UI can reassure the user with a "last synced" time.
      const remaining = await db.sync_queue
        .where("status")
        .anyOf("pending", "failed")
        .count();
      if (remaining === 0 && connectivity.isReachable()) {
        const now = nowIso();
        await db.metadata.put({ key: META_KEYS.lastSyncAt, value: now, updatedAt: now });
      }
    } finally {
      this.pushing = false;
      if (this.coalesced) {
        this.coalesced = false;
        this.requestPush();
      } else {
        void this.scheduleRetry();
      }
    }
  }

  /** If failed items remain, schedule one wake-up at the earliest backoff time. */
  private async scheduleRetry(): Promise<void> {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    const failed = await db.sync_queue.where("status").equals("failed").toArray();
    if (failed.length === 0) return;

    const soonest = failed
      .map((item) => (item.nextAttemptAt ? Date.parse(item.nextAttemptAt) : Date.now()))
      .reduce((min, ts) => Math.min(min, ts), Number.POSITIVE_INFINITY);
    const delay = Math.max(soonest - Date.now(), 500);
    this.retryTimer = setTimeout(() => this.requestPush(), delay);
  }
}

/** App-wide singleton sync controller. */
export const syncController = new SyncController();
