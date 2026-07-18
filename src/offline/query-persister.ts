import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

import { db } from "@/offline/db";
import { nowIso } from "@/offline/ids";

/**
 * React Query persistence for read-only offline browsing (Phase 6, Fitness).
 *
 * Finance and Productivity own their offline data via the Dexie repository +
 * sync queue. Fitness is read-only offline, and its reads assemble deeply-nested
 * DTOs (plans → days → exercises → sets, sessions, PRs, measurements). Rather
 * than re-normalise all of that, we persist the whole React Query cache to
 * IndexedDB: cached results survive a reload and render offline, with no change
 * to any fitness service. Mutations are never persisted, keeping this a pure
 * read cache.
 *
 * Storage is the Dexie `metadata` table (IndexedDB) — localStorage would be far
 * too small for cached workout history.
 */
const dexieAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const record = await db.metadata.get(key);
    return typeof record?.value === "string" ? record.value : null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await db.metadata.put({ key, value, updatedAt: nowIso() });
  },
  removeItem: async (key: string): Promise<void> => {
    await db.metadata.delete(key);
  },
};

export const queryPersister = createAsyncStoragePersister({
  storage: dexieAsyncStorage,
  key: "lifetrack-query-cache",
  throttleTime: 1000,
});

/** Bump to discard all persisted cache after a breaking data-shape change. */
export const PERSIST_BUSTER = "v1";

/** Persisted queries older than this are dropped on restore (7 days). */
export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 7;
