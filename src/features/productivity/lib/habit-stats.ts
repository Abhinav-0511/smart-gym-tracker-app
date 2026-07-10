// Pure, unit-testable derivation of habit streaks and completion rate from the
// set of completed date keys and the habit's frequency. Nothing here is stored;
// it is recomputed from habit_logs, consistent with the app's "derive" approach.

import { addDays, isoWeekdayOfKey } from "@/features/productivity/lib/date-keys";
import {
  isHabitDueOnWeekday,
  type Habit,
  type HabitStats,
} from "@/features/productivity/types/habit";

/** Number of trailing days considered when computing the completion rate. */
export const COMPLETION_RATE_WINDOW_DAYS = 30;

type FrequencyLike = Pick<Habit, "frequency" | "customDays">;

function isDue(habit: FrequencyLike, key: string): boolean {
  return isHabitDueOnWeekday(habit, isoWeekdayOfKey(key));
}

/**
 * Current streak: consecutive due days ending today that were completed. Today
 * is treated with grace — if it is due but not yet completed, the streak from
 * prior days is preserved rather than reset to zero.
 */
function currentStreak(
  habit: FrequencyLike,
  completed: Set<string>,
  todayKey: string,
  floorKey: string,
): number {
  let streak = 0;
  let cursor = todayKey;

  while (cursor >= floorKey) {
    if (isDue(habit, cursor)) {
      if (completed.has(cursor)) {
        streak += 1;
      } else if (cursor !== todayKey) {
        break;
      }
    }
    cursor = addDays(cursor, -1);
  }

  return streak;
}

/** Longest run of consecutive completed due days across the tracked history. */
function longestStreak(
  habit: FrequencyLike,
  completed: Set<string>,
  todayKey: string,
  floorKey: string,
): number {
  let longest = 0;
  let run = 0;
  let cursor = floorKey;

  while (cursor <= todayKey) {
    if (isDue(habit, cursor)) {
      if (completed.has(cursor)) {
        run += 1;
        longest = Math.max(longest, run);
      } else if (cursor !== todayKey) {
        run = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }

  return longest;
}

/**
 * Completion rate over the trailing window: share of due days that were
 * completed. Today is only counted once completed, so an in-progress day never
 * drags the rate down.
 */
function completionRate(
  habit: FrequencyLike,
  completed: Set<string>,
  todayKey: string,
): number {
  const windowStart = addDays(todayKey, -(COMPLETION_RATE_WINDOW_DAYS - 1));
  let due = 0;
  let done = 0;
  let cursor = windowStart;

  while (cursor <= todayKey) {
    if (isDue(habit, cursor)) {
      const isCompleted = completed.has(cursor);
      if (cursor !== todayKey || isCompleted) {
        due += 1;
        if (isCompleted) done += 1;
      }
    }
    cursor = addDays(cursor, 1);
  }

  return due === 0 ? 0 : Math.round((done / due) * 100);
}

export interface HabitStatsInput {
  habit: FrequencyLike;
  /** Completed log date keys for this habit (any window covering the streak). */
  completedKeys: Iterable<string>;
  todayKey: string;
  /** Lifetime completion count (from the habit_completion_totals view). */
  totalCompletions: number;
  /** Lifetime last completed date key, or null. */
  lastCompletedOn: string | null;
}

export function computeHabitStats({
  habit,
  completedKeys,
  todayKey,
  totalCompletions,
  lastCompletedOn,
}: HabitStatsInput): HabitStats {
  const completed = new Set(completedKeys);
  // Floor iteration at the earliest completion so bounded, non-empty histories
  // terminate quickly; empty histories resolve in a couple of steps.
  const earliest = completed.size > 0 ? [...completed].sort()[0] : todayKey;
  const floorKey = earliest < todayKey ? earliest : todayKey;

  const current = currentStreak(habit, completed, todayKey, floorKey);
  const longest = Math.max(current, longestStreak(habit, completed, todayKey, floorKey));

  return {
    currentStreak: current,
    longestStreak: longest,
    completionRate: completionRate(habit, completed, todayKey),
    totalCompletions,
    completedToday: completed.has(todayKey),
    lastCompletedOn,
  };
}
