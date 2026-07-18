import { syncController } from "@/offline/sync/controller";

/**
 * Boot the offline sync engine. Idempotent — call once at app startup. Starting
 * the controller also boots the connectivity heartbeat (via its subscription),
 * so a fresh session immediately flushes any writes queued in a previous one.
 */
export function startOfflineSync(): void {
  if (typeof window === "undefined") return;
  syncController.start();
}

export { syncController } from "@/offline/sync/controller";
export { enqueue, pendingCount } from "@/offline/sync/queue";
