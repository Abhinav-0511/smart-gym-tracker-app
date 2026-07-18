import { db } from "@/offline/db";
import { syncController } from "@/offline/sync/controller";

/**
 * Recover from a sync interrupted mid-flight (tab closed / crash while an item
 * was being pushed). Such an item is left marked `syncing`; reset it to
 * `pending` so the next drain replays it. Safe because pushes are idempotent.
 */
async function recoverInterruptedSync(): Promise<void> {
  const stuck = await db.sync_queue.where("status").equals("syncing").toArray();
  await Promise.all(
    stuck.map((item) =>
      item.seq === undefined
        ? Promise.resolve()
        : db.sync_queue.update(item.seq, { status: "pending" }),
    ),
  );
}

/**
 * Boot the offline sync engine. Idempotent — call once at app startup. Starting
 * the controller also boots the connectivity heartbeat (via its subscription),
 * so a fresh session immediately flushes any writes queued in a previous one.
 */
export async function startOfflineSync(): Promise<void> {
  if (typeof window === "undefined") return;
  await recoverInterruptedSync();
  syncController.start();
}

export { syncController } from "@/offline/sync/controller";
export { enqueue, pendingCount } from "@/offline/sync/queue";
