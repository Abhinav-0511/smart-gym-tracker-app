import { db, type LocalRow } from "@/offline/db";
import { connectivity } from "@/offline/connectivity";
import { newId, nowIso } from "@/offline/ids";
import { enqueue } from "@/offline/sync/queue";
import { syncController } from "@/offline/sync/controller";
import type { SyncedTable, WritableTable } from "@/offline/types";

/**
 * The repository is the offline data layer's read/write surface. Feature
 * services call these helpers instead of touching Supabase, so the UI never
 * depends on the network directly:
 *
 *  - Reads: `pullMirror` refreshes the local cache from Supabase when online
 *    (after flushing pending writes), then the service reads rows out of Dexie.
 *    Offline, the pull is skipped and the service simply reads whatever is
 *    cached — the key to surviving a hard refresh with no network.
 *  - Writes: `localInsert/Update/Delete` are write-through-local. They commit
 *    the row and its sync-queue entry in a single Dexie transaction and return
 *    immediately, then nudge the sync controller to push (now if online, later
 *    if not). This is what makes an offline edit survive an app kill.
 *
 * All rows are server-shaped (snake_case); the service layer owns domain mapping.
 */

/**
 * Refresh the local mirror of `table` from the server when reachable.
 *
 * Pending local writes are flushed *first* so the subsequent pull can't
 * overwrite a not-yet-synced local row with stale server state. We `bulkPut`
 * (upsert, never bulk-delete) so locally-created rows awaiting push are
 * preserved. No-op when offline.
 */
export async function pullMirror(
  table: SyncedTable,
  fetchServerRows: () => Promise<LocalRow[]>,
): Promise<void> {
  if (!connectivity.isReachable()) return;
  await syncController.push();
  const rows = await fetchServerRows();
  await db.table<LocalRow, string>(table).bulkPut(rows);
}

/** All cached rows for a user in a table (server-shaped, unsorted). */
export function localRowsByUser(table: SyncedTable, userId: string): Promise<LocalRow[]> {
  return db.table<LocalRow, string>(table).where("user_id").equals(userId).toArray();
}

/** A single cached row by id. */
export function localRow(table: SyncedTable, id: string): Promise<LocalRow | undefined> {
  return db.table<LocalRow, string>(table).get(id);
}

/**
 * Create a row locally and queue it for the server. Assigns a client id and
 * timestamps if absent. Returns the persisted server-shaped row.
 */
export async function localInsert(
  table: WritableTable,
  row: Record<string, unknown>,
  userId: string,
): Promise<LocalRow> {
  const now = nowIso();
  const full: LocalRow = {
    ...row,
    id: (row.id as string | undefined) ?? newId(),
    created_at: (row.created_at as string | undefined) ?? now,
    updated_at: now,
  };
  await db.transaction("rw", db.table(table), db.sync_queue, async () => {
    await db.table<LocalRow, string>(table).put(full);
    await enqueue({ table, entityId: full.id, operation: "insert", payload: full, userId });
  });
  syncController.requestPush();
  return full;
}

/**
 * Merge a patch into an existing local row and queue the update. Returns the
 * updated server-shaped row.
 */
export async function localUpdate(
  table: WritableTable,
  id: string,
  patch: Record<string, unknown>,
  userId?: string,
): Promise<LocalRow> {
  let updated: LocalRow = { id };
  await db.transaction("rw", db.table(table), db.sync_queue, async () => {
    const existing = await db.table<LocalRow, string>(table).get(id);
    updated = { ...(existing ?? { id }), ...patch, id, updated_at: nowIso() };
    await db.table<LocalRow, string>(table).put(updated);
    await enqueue({
      table,
      entityId: id,
      operation: "update",
      payload: updated,
      userId: userId ?? (existing?.user_id as string | undefined) ?? "",
    });
  });
  syncController.requestPush();
  return updated;
}

/** Delete a row locally and queue the deletion. */
export async function localDelete(
  table: WritableTable,
  id: string,
  userId?: string,
): Promise<void> {
  await db.transaction("rw", db.table(table), db.sync_queue, async () => {
    const existing = await db.table<LocalRow, string>(table).get(id);
    await db.table<LocalRow, string>(table).delete(id);
    await enqueue({
      table,
      entityId: id,
      operation: "delete",
      payload: null,
      userId: userId ?? (existing?.user_id as string | undefined) ?? "",
    });
  });
  syncController.requestPush();
}
