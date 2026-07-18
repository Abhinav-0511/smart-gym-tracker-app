import { db } from "@/offline/db";
import { getDeviceId } from "@/offline/device";
import { newId, nowIso } from "@/offline/ids";
import type { SyncOperation, SyncQueueItem, WritableTable } from "@/offline/types";

/**
 * Append a mutation to the durable sync queue.
 *
 * Intended to be called *inside* a Dexie read-write transaction that also
 * writes the affected row, so the row and its queue entry commit atomically —
 * a crash can never leave a persisted row without its pending sync (or vice
 * versa). Dexie propagates the active transaction through its zone, so the
 * `db.sync_queue.add` here joins the caller's transaction automatically.
 */
export interface EnqueueParams {
  table: WritableTable;
  entityId: string;
  operation: SyncOperation;
  /** Server-shaped row for insert/update; null for delete. */
  payload: Record<string, unknown> | null;
  userId: string;
}

export async function enqueue(params: EnqueueParams): Promise<void> {
  const item: SyncQueueItem = {
    id: newId(),
    table: params.table,
    entityId: params.entityId,
    operation: params.operation,
    payload: params.payload,
    timestamp: nowIso(),
    retryCount: 0,
    nextAttemptAt: null,
    lastError: null,
    status: "pending",
    userId: params.userId,
    deviceId: getDeviceId(),
  };
  await db.sync_queue.add(item);
}

/** Count of queue items that still need to reach the server. */
export function pendingCount(): Promise<number> {
  return db.sync_queue.where("status").notEqual("done").count();
}
