import Dexie, { type Table } from "dexie";

import type { MetadataRecord, SyncQueueItem } from "@/offline/types";

/**
 * IndexedDB (via Dexie) is the app's local source of truth. Every synced
 * Supabase table has a mirror store here keyed by the row's `id`. Rows are
 * stored *server-shaped* (snake_case, exactly as Supabase returns them) so the
 * sync engine can push/pull without re-mapping; the existing `services/*` layer
 * continues to own the snake_case ↔ camelCase domain mapping for the UI.
 *
 * Index strings only need to list the fields we actually query on. `id` is the
 * primary key for every data store; additional indexes support the read paths
 * each module relies on (e.g. Finance filters transactions by user + date).
 */

/** A locally-stored row. Concrete column shapes come from `@/types/database`. */
export type LocalRow = Record<string, unknown> & { id: string };

export class LifeTrackDB extends Dexie {
  // --- Finance ---
  transactions!: Table<LocalRow, string>;
  finance_accounts!: Table<LocalRow, string>;
  transaction_categories!: Table<LocalRow, string>;
  budgets!: Table<LocalRow, string>;
  recurring_transactions!: Table<LocalRow, string>;
  savings_goals!: Table<LocalRow, string>;

  // --- Productivity ---
  tasks!: Table<LocalRow, string>;
  habits!: Table<LocalRow, string>;
  habit_logs!: Table<LocalRow, string>;

  // --- Identity ---
  profiles!: Table<LocalRow, string>;

  // --- Fitness (read-only cache) ---
  workout_plans!: Table<LocalRow, string>;
  workout_plan_days!: Table<LocalRow, string>;
  workout_plan_exercises!: Table<LocalRow, string>;
  workout_plan_sets!: Table<LocalRow, string>;
  workout_sessions!: Table<LocalRow, string>;
  workout_session_exercises!: Table<LocalRow, string>;
  workout_session_sets!: Table<LocalRow, string>;
  exercise_catalog!: Table<LocalRow, string>;
  personal_records!: Table<LocalRow, string>;
  body_weight_entries!: Table<LocalRow, string>;
  user_achievements!: Table<LocalRow, string>;

  // --- Offline infrastructure ---
  sync_queue!: Table<SyncQueueItem, number>;
  metadata!: Table<MetadataRecord, string>;

  constructor() {
    super("lifetrack");

    this.version(1).stores({
      // Finance
      transactions: "id, user_id, occurred_on, account_id, category_id, updated_at",
      finance_accounts: "id, user_id, updated_at",
      transaction_categories: "id, user_id, updated_at",
      budgets: "id, user_id, updated_at",
      recurring_transactions: "id, user_id, next_run_on, updated_at",
      savings_goals: "id, user_id, updated_at",

      // Productivity
      tasks: "id, user_id, status, due_on, updated_at",
      habits: "id, user_id, updated_at",
      habit_logs: "id, user_id, habit_id, logged_on, updated_at",

      // Identity (profiles are keyed by the user's id)
      profiles: "id, updated_at",

      // Fitness (read-only cache)
      workout_plans: "id, user_id, updated_at",
      workout_plan_days: "id, plan_id, updated_at",
      workout_plan_exercises: "id, plan_day_id, updated_at",
      workout_plan_sets: "id, plan_exercise_id, updated_at",
      workout_sessions: "id, user_id, started_at, updated_at",
      workout_session_exercises: "id, session_id, updated_at",
      workout_session_sets: "id, session_exercise_id, updated_at",
      exercise_catalog: "id, updated_at",
      personal_records: "id, user_id, updated_at",
      body_weight_entries: "id, user_id, recorded_on, updated_at",
      user_achievements: "id, user_id, updated_at",

      // Infrastructure. `++seq` = auto-incrementing replay order.
      sync_queue: "++seq, id, status, table, entityId, userId, nextAttemptAt",
      metadata: "key",
    });
  }
}

/** Singleton database handle used across the offline layer. */
export const db = new LifeTrackDB();
