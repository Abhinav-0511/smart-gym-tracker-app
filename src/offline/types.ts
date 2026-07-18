/**
 * Core type definitions for the offline data layer.
 *
 * These types are deliberately storage-shaped (snake_case table names, plain
 * JSON payloads) rather than domain-shaped: they describe rows as they live in
 * IndexedDB and travel to Supabase, not the camelCase models the UI consumes.
 * Domain mapping stays in the existing `services/*` layer.
 */

/** Supabase table names that participate in offline sync. Single source of truth. */
export const SYNCED_TABLES = [
  // Finance (first full-offline slice)
  "transactions",
  "finance_accounts",
  "transaction_categories",
  "budgets",
  "recurring_transactions",
  "savings_goals",
  // Productivity (second slice)
  "tasks",
  "habits",
  "habit_logs",
  // Identity
  "profiles",
  // Fitness (read-only cache — pulled, never queued for push)
  "workout_plans",
  "workout_plan_days",
  "workout_plan_exercises",
  "workout_plan_sets",
  "workout_sessions",
  "workout_session_exercises",
  "workout_session_sets",
  "exercise_catalog",
  "personal_records",
  "body_weight_entries",
  "user_achievements",
] as const;

export type SyncedTable = (typeof SYNCED_TABLES)[number];

/** Tables the client is allowed to mutate offline (everything else is pull-only). */
export const WRITABLE_TABLES = [
  "transactions",
  "finance_accounts",
  "transaction_categories",
  "budgets",
  "recurring_transactions",
  "savings_goals",
  "tasks",
  "habits",
  "habit_logs",
  "profiles",
] as const satisfies readonly SyncedTable[];

export type WritableTable = (typeof WRITABLE_TABLES)[number];

export function isWritableTable(table: string): table is WritableTable {
  return (WRITABLE_TABLES as readonly string[]).includes(table);
}

/** The three mutation kinds an offline change can represent. */
export type SyncOperation = "insert" | "update" | "delete";

/** Lifecycle of a queued mutation as the sync engine works through it. */
export type SyncStatus = "pending" | "syncing" | "failed" | "done";

/**
 * A single durable, replayable mutation captured while the app made a local
 * write. Ordered by the auto-incrementing `seq` so replay preserves causality.
 */
export interface SyncQueueItem {
  /** Auto-incremented by Dexie; defines replay order. Absent until persisted. */
  seq?: number;
  /** Stable UUID for this queue entry (distinct from the affected row's id). */
  id: string;
  /** Target Supabase table. */
  table: WritableTable;
  /** Primary key of the affected row. */
  entityId: string;
  /** What to do with the row on the server. */
  operation: SyncOperation;
  /**
   * Full row payload for insert/update (snake_case, server-shaped), or `null`
   * for a delete. Stored as-is so replay needs no re-derivation.
   */
  payload: Record<string, unknown> | null;
  /** Client timestamp of the mutation (ISO-8601) — drives Last-Write-Wins. */
  timestamp: string;
  /** Number of failed push attempts; drives exponential backoff. */
  retryCount: number;
  /** Not-before time (ISO-8601) computed from backoff; null = eligible now. */
  nextAttemptAt: string | null;
  /** Last error message, for diagnostics/UX. */
  lastError: string | null;
  status: SyncStatus;
  /** Owner of the change (RLS scoping + multi-account safety). */
  userId: string;
  /** Originating device (provenance). */
  deviceId: string;
}

/** Well-known keys for the `metadata` key/value store. */
export const META_KEYS = {
  /** Whether the initial post-login hydration completed for a user. */
  hydratedUserId: "hydrated_user_id",
  /** Per-table high-water mark (max updated_at seen) for incremental pull. */
  lastPulledAt: (table: SyncedTable) => `last_pulled_at:${table}`,
  /** Timestamp of the last fully-successful sync cycle. */
  lastSyncAt: "last_sync_at",
  /** Local Dexie schema version marker (independent of Dexie's own versioning). */
  schemaVersion: "schema_version",
} as const;

export interface MetadataRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}
