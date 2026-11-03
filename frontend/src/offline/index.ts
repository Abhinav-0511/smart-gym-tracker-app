/**
 * Public entry point for the offline data layer.
 *
 * Phase 1 (foundation): local database, connectivity, device identity, and the
 * sync-queue type model. These primitives are intentionally *dormant* — no
 * existing service, hook, or component imports them yet. Later phases wire in
 * repositories (read/write Dexie + enqueue) and the sync engine.
 */
export { db, LifeTrackDB, type LocalRow } from "@/offline/db";
export { connectivity, type ConnectivityState } from "@/offline/connectivity";
export { getDeviceId } from "@/offline/device";
export { newId, nowIso } from "@/offline/ids";
export {
  SYNCED_TABLES,
  WRITABLE_TABLES,
  META_KEYS,
  isWritableTable,
  type SyncedTable,
  type WritableTable,
  type SyncOperation,
  type SyncStatus,
  type SyncQueueItem,
  type MetadataRecord,
} from "@/offline/types";
