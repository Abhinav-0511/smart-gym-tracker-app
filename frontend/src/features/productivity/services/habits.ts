import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/types/database";
import { connectivity } from "@/offline/connectivity";
import type { LocalRow } from "@/offline/db";
import { deterministicId } from "@/offline/ids";
import {
  localDelete,
  localInsert,
  localRowsByUser,
  localUpdate,
  pullMirror,
} from "@/offline/repository";
import { addDays } from "@/features/productivity/lib/date-keys";
import { computeHabitStats } from "@/features/productivity/lib/habit-stats";
import type {
  CreateHabitInput,
  Habit,
  HabitColor,
  HabitFrequency,
  HabitStatus,
  HabitWithStats,
  IsoWeekday,
  UpdateHabitInput,
} from "@/features/productivity/types/habit";

/** Days of history loaded for streak computation and the heatmap (~53 weeks). */
export const HABIT_HISTORY_WINDOW_DAYS = 372;

type SupabaseLikeError = { code?: string; message: string };

function throwIfError(error: SupabaseLikeError | null): void {
  if (error) throw new Error(error.message);
}

function mapHabit(row: Tables<"habits">): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    category: row.category as Habit["category"],
    icon: row.icon,
    color: row.color as HabitColor,
    frequency: row.frequency as HabitFrequency,
    customDays: (row.custom_days as IsoWeekday[] | null) ?? null,
    targetValue: row.target_value,
    unit: row.unit,
    reminderEnabled: row.reminder_enabled,
    reminderTime: row.reminder_time,
    status: row.status as HabitStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** A habit with its derived stats plus the completed date keys in the window. */
export interface HabitWithHistory extends HabitWithStats {
  recentCompletedKeys: string[];
}

export interface FetchHabitsOptions {
  includeArchived?: boolean;
}

/** Raw server rows for the habit definitions (all statuses, for a complete cache). */
async function fetchServerHabitRows(userId: string): Promise<LocalRow[]> {
  const { data, error } = await supabase.from("habits").select("*").eq("user_id", userId);
  throwIfError(error);
  return (data ?? []) as unknown as LocalRow[];
}

/** Raw server rows for every habit log in the history window (both completed states). */
async function fetchServerHabitLogRows(
  userId: string,
  windowStart: string,
): Promise<LocalRow[]> {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", windowStart);
  throwIfError(error);
  return (data ?? []) as unknown as LocalRow[];
}

export async function fetchHabits(
  userId: string,
  todayKey: string,
  options: FetchHabitsOptions = {},
): Promise<HabitWithHistory[]> {
  const windowStart = addDays(todayKey, -(HABIT_HISTORY_WINDOW_DAYS - 1));

  // Refresh both local caches from the server when online.
  await pullMirror("habits", () => fetchServerHabitRows(userId));
  await pullMirror("habit_logs", () => fetchServerHabitLogRows(userId, windowStart));

  // Accurate all-time totals come from a server view; available online only.
  // Offline we approximate from the windowed local logs (same fallback the
  // original code used when the view was empty).
  const totalsByHabit = new Map<
    string,
    { completed_count: number; last_completed_on: string | null }
  >();
  if (connectivity.isReachable()) {
    const { data } = await supabase
      .from("habit_completion_totals")
      .select("*")
      .eq("user_id", userId);
    for (const row of data ?? []) {
      if (!row.habit_id) continue;
      totalsByHabit.set(row.habit_id, {
        completed_count: row.completed_count ?? 0,
        last_completed_on: row.last_completed_on ?? null,
      });
    }
  }

  let habitRows = await localRowsByUser("habits", userId);
  if (!options.includeArchived) {
    habitRows = habitRows.filter(
      (row) => row.status === "active" || row.status === "paused",
    );
  }
  habitRows.sort((a, b) =>
    ((a.created_at as string) ?? "").localeCompare((b.created_at as string) ?? ""),
  );

  const logRows = (await localRowsByUser("habit_logs", userId)).filter(
    (row) => row.completed === true && (row.log_date as string) >= windowStart,
  );
  const completedByHabit = new Map<string, string[]>();
  for (const log of logRows) {
    const habitId = log.habit_id as string;
    const keys = completedByHabit.get(habitId) ?? [];
    keys.push(log.log_date as string);
    completedByHabit.set(habitId, keys);
  }

  return habitRows.map((row) => {
    const habit = mapHabit(row as unknown as Tables<"habits">);
    const recentCompletedKeys = (completedByHabit.get(habit.id) ?? []).sort();
    const totals = totalsByHabit.get(habit.id);

    const stats = computeHabitStats({
      habit,
      completedKeys: recentCompletedKeys,
      todayKey,
      totalCompletions: totals?.completed_count ?? recentCompletedKeys.length,
      lastCompletedOn:
        totals?.last_completed_on ?? recentCompletedKeys.at(-1) ?? null,
    });

    return { ...habit, stats, recentCompletedKeys };
  });
}

export async function createHabit(
  userId: string,
  input: CreateHabitInput,
): Promise<Habit> {
  const row = await localInsert(
    "habits",
    {
      user_id: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category,
      icon: input.icon,
      color: input.color,
      frequency: input.frequency,
      custom_days: input.frequency === "custom" ? input.customDays ?? null : null,
      target_value: input.targetValue ?? null,
      unit: input.unit?.trim() || null,
      reminder_enabled: input.reminderEnabled,
      reminder_time: input.reminderEnabled ? input.reminderTime ?? null : null,
      status: "active",
    },
    userId,
  );
  return mapHabit(row as unknown as Tables<"habits">);
}

export async function updateHabit(
  habitId: string,
  input: UpdateHabitInput,
): Promise<Habit> {
  const patch: TablesUpdate<"habits"> = {};

  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.category !== undefined) patch.category = input.category;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.color !== undefined) patch.color = input.color;
  if (input.frequency !== undefined) {
    patch.frequency = input.frequency;
    patch.custom_days = input.frequency === "custom" ? input.customDays ?? null : null;
  } else if (input.customDays !== undefined) {
    patch.custom_days = input.customDays;
  }
  if (input.targetValue !== undefined) patch.target_value = input.targetValue;
  if (input.unit !== undefined) patch.unit = input.unit?.trim() || null;
  if (input.reminderEnabled !== undefined) {
    patch.reminder_enabled = input.reminderEnabled;
    if (!input.reminderEnabled) patch.reminder_time = null;
  }
  if (input.reminderTime !== undefined) patch.reminder_time = input.reminderTime;
  if (input.status !== undefined) patch.status = input.status;

  const row = await localUpdate("habits", habitId, patch as Record<string, unknown>);
  return mapHabit(row as unknown as Tables<"habits">);
}

export async function setHabitStatus(
  habitId: string,
  status: HabitStatus,
): Promise<Habit> {
  return updateHabit(habitId, { status });
}

export async function deleteHabit(habitId: string): Promise<void> {
  await localDelete("habits", habitId);
}

/**
 * A habit completion's identity is its (habit_id, log_date). We derive a
 * deterministic id from that pair so the same completion produces the same row
 * on every device, and the sync push upserts on the natural key — making
 * complete/undo idempotent and convergent (never duplicated) across devices.
 */
function habitLogId(habitId: string, dateKey: string): string {
  return deterministicId(`${habitId}:${dateKey}`);
}

export async function completeHabit(
  userId: string,
  habitId: string,
  dateKey: string,
  value: number | null = null,
): Promise<void> {
  await localInsert(
    "habit_logs",
    {
      id: habitLogId(habitId, dateKey),
      habit_id: habitId,
      user_id: userId,
      log_date: dateKey,
      completed: true,
      value,
    },
    userId,
  );
}

/**
 * Undo toggles `completed` to false rather than deleting the row: the server's
 * habit queries filter on `completed = true`, so a false row is effectively
 * removed while still syncing via the same idempotent (habit_id, log_date) upsert.
 */
export async function undoHabitCompletion(
  userId: string,
  habitId: string,
  dateKey: string,
): Promise<void> {
  await localInsert(
    "habit_logs",
    {
      id: habitLogId(habitId, dateKey),
      habit_id: habitId,
      user_id: userId,
      log_date: dateKey,
      completed: false,
      value: null,
    },
    userId,
  );
}
