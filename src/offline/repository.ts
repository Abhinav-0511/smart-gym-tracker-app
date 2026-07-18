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

  // Last-Write-Wins, "pending wins" variant: never let a pulled server row
  // clobber a local row that still has an un-pushed change queued. We use the
  // presence of a pending queue entry as the local-wins signal rather than
  // comparing timestamps, because the server's set_updated_at trigger owns
  // updated_at and client clocks can't be trusted against it. Any entity whose
  // change is already flushed has no queue entry, so the fresh server copy wins.
  const pendingIds = await pendingEntityIds(table);
  const safe =
    pendingIds.size === 0 ? rows : rows.filter((row) => !pendingIds.has(row.id));
  await db.table<LocalRow, string>(table).bulkPut(safe);
}

/** Ids in `table` that still have an unsynced mutation queued. */
async function pendingEntityIds(table: SyncedTable): Promise<Set<string>> {
  const items = await db.sync_queue.where("table").equals(table).toArray();
  const ids = new Set<string>();
  for (const item of items) {
    if (item.status !== "done") ids.add(item.entityId);
  }
  return ids;
}

/**
 * Live cached rows for a user (server-shaped, unsorted) — soft-deleted rows
 * (tombstones with `deleted_at` set) are excluded, as every read path expects.
 */
export async function localRowsByUser(
  table: SyncedTable,
  userId: string,
): Promise<LocalRow[]> {
  const rows = await db.table<LocalRow, string>(table).where("user_id").equals(userId).toArray();
  return rows.filter((row) => !row.deleted_at);
}

/**
 * All cached rows for a user *including* tombstones. Needed where uniqueness
 * spans deleted rows too — e.g. default-category seeding must not re-insert a
 * category the user soft-deleted, or the server's unique index would reject it.
 */
export function localRowsByUserIncludingDeleted(
  table: SyncedTable,
  userId: string,
): Promise<LocalRow[]> {
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

/**
 * Soft-delete a row: stamp `deleted_at` and keep it locally as a tombstone so
 * the deletion propagates to other devices on the next pull (a hard delete would
 * let a concurrent pull resurrect the row). Reads filter tombstones out, so it
 * disappears from the UI immediately. Queued as an ordinary update.
 */
export async function localDelete(
  table: WritableTable,
  id: string,
  userId?: string,
): Promise<void> {
  await localUpdate(table, id, { deleted_at: nowIso() }, userId);
}
