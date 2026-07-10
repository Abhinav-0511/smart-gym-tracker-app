import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/types/database";
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

export async function fetchHabits(
  userId: string,
  todayKey: string,
  options: FetchHabitsOptions = {},
): Promise<HabitWithHistory[]> {
  const windowStart = addDays(todayKey, -(HABIT_HISTORY_WINDOW_DAYS - 1));

  const habitsQuery = supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!options.includeArchived) {
    habitsQuery.in("status", ["active", "paused"]);
  }

  const [habitsResult, totalsResult, logsResult] = await Promise.all([
    habitsQuery,
    supabase.from("habit_completion_totals").select("*").eq("user_id", userId),
    supabase
      .from("habit_logs")
      .select("habit_id, log_date, completed")
      .eq("user_id", userId)
      .eq("completed", true)
      .gte("log_date", windowStart),
  ]);

  throwIfError(habitsResult.error);
  throwIfError(totalsResult.error);
  throwIfError(logsResult.error);

  const totalsByHabit = new Map(
    (totalsResult.data ?? []).map((row) => [row.habit_id, row]),
  );

  const completedByHabit = new Map<string, string[]>();
  for (const log of logsResult.data ?? []) {
    const keys = completedByHabit.get(log.habit_id) ?? [];
    keys.push(log.log_date);
    completedByHabit.set(log.habit_id, keys);
  }

  return (habitsResult.data ?? []).map((row) => {
    const habit = mapHabit(row);
    const recentCompletedKeys = (completedByHabit.get(habit.id) ?? []).sort();
    const totals = totalsByHabit.get(habit.id);

    const stats = computeHabitStats({
      habit,
      completedKeys: recentCompletedKeys,
      todayKey,
      totalCompletions: totals?.completed_count ?? recentCompletedKeys.length,
      lastCompletedOn: totals?.last_completed_on ?? null,
    });

    return { ...habit, stats, recentCompletedKeys };
  });
}

export async function createHabit(
  userId: string,
  input: CreateHabitInput,
): Promise<Habit> {
  const { data, error } = await supabase
    .from("habits")
    .insert({
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
    })
    .select("*")
    .single();

  throwIfError(error);
  return mapHabit(data as Tables<"habits">);
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

  const { data, error } = await supabase
    .from("habits")
    .update(patch)
    .eq("id", habitId)
    .select("*")
    .single();

  throwIfError(error);
  return mapHabit(data as Tables<"habits">);
}

export async function setHabitStatus(
  habitId: string,
  status: HabitStatus,
): Promise<Habit> {
  return updateHabit(habitId, { status });
}

export async function deleteHabit(habitId: string): Promise<void> {
  const { error } = await supabase.from("habits").delete().eq("id", habitId);
  throwIfError(error);
}

export async function completeHabit(
  userId: string,
  habitId: string,
  dateKey: string,
  value: number | null = null,
): Promise<void> {
  const { error } = await supabase
    .from("habit_logs")
    .upsert(
      {
        habit_id: habitId,
        user_id: userId,
        log_date: dateKey,
        completed: true,
        value,
      },
      { onConflict: "habit_id,log_date" },
    );

  throwIfError(error);
}

export async function undoHabitCompletion(
  habitId: string,
  dateKey: string,
): Promise<void> {
  const { error } = await supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", habitId)
    .eq("log_date", dateKey);

  throwIfError(error);
}
