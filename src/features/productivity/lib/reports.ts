// Pure derivation of Productivity reports from habits + tasks. Everything here
// is computed from source records (no stored aggregates), consistent with the
// rest of the app, and is unit-tested.

import { addDays, isoWeekdayOfKey } from "@/features/productivity/lib/date-keys";
import { getLocalDateString } from "@/types/dashboard";
import { isHabitDueOn } from "@/features/productivity/types/habit";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import { parseDateKey } from "@/features/productivity/lib/date-keys";
import type { Task } from "@/features/productivity/types/task";

export type ReportPeriod = "week" | "month";

export const REPORT_PERIODS: { id: ReportPeriod; label: string; days: number }[] = [
  { id: "week", label: "This Week", days: 7 },
  { id: "month", label: "This Month", days: 30 },
];

export interface TrendPoint {
  key: string;
  label: string;
  habits: number;
  tasks: number;
}

export interface CategorySlice {
  category: string;
  count: number;
}

export interface ProductivityReport {
  periodDays: number;
  /** Share of due habit-days that were completed across the window (0–100). */
  habitSuccessRate: number;
  /** Share of tasks due in the window that are completed (0–100). */
  taskCompletionRate: number;
  habitCompletions: number;
  tasksCompleted: number;
  longestStreak: number;
  /** Weekday name with the most completions, or null when there is no data. */
  mostProductiveDay: string | null;
  trend: TrendPoint[];
  categoryBreakdown: CategorySlice[];
}

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export interface ReportInput {
  habits: HabitWithHistory[];
  tasks: Task[];
  todayKey: string;
  periodDays: number;
  timezone: string;
}

export function buildProductivityReport({
  habits,
  tasks,
  todayKey,
  periodDays,
  timezone,
}: ReportInput): ProductivityReport {
  const startKey = addDays(todayKey, -(periodDays - 1));
  const activeHabits = habits.filter((habit) => habit.status !== "archived");

  // Per-day completion counts across the window drive the trend + productive day.
  const dayKeys: string[] = [];
  for (let cursor = startKey; cursor <= todayKey; cursor = addDays(cursor, 1)) {
    dayKeys.push(cursor);
  }

  const completionsByWeekday = new Array(7).fill(0) as number[];

  let dueHabitDays = 0;
  let completedHabitDays = 0;
  const trend: TrendPoint[] = dayKeys.map((key) => {
    const date = parseDateKey(key);
    let habitCount = 0;
    for (const habit of activeHabits) {
      const due = isHabitDueOn(habit, date);
      const done = habit.recentCompletedKeys.includes(key);
      if (due) {
        dueHabitDays += 1;
        if (done) completedHabitDays += 1;
      }
      if (done) habitCount += 1;
    }

    completionsByWeekday[isoWeekdayOfKey(key) - 1] += habitCount;

    return {
      key,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }),
      habits: habitCount,
      tasks: 0,
    };
  });

  const trendIndex = new Map(trend.map((point) => [point.key, point]));

  // Tasks due within the window.
  const windowTasks = tasks.filter(
    (task) => task.dueDate && task.dueDate >= startKey && task.dueDate <= todayKey,
  );
  const completedWindowTasks = windowTasks.filter((task) => task.status === "completed");

  let tasksCompleted = 0;
  for (const task of tasks) {
    if (task.status !== "completed" || !task.completedAt) continue;
    const completedKey = getLocalDateString(new Date(task.completedAt), timezone);
    const point = trendIndex.get(completedKey);
    if (point) {
      point.tasks += 1;
      tasksCompleted += 1;
      completionsByWeekday[isoWeekdayOfKey(completedKey) - 1] += 1;
    }
  }

  const habitCompletions = trend.reduce((sum, point) => sum + point.habits, 0);
  const longestStreak = activeHabits.reduce(
    (max, habit) => Math.max(max, habit.stats.longestStreak),
    0,
  );

  const maxWeekday = completionsByWeekday.reduce(
    (best, count, index) => (count > completionsByWeekday[best] ? index : best),
    0,
  );
  const mostProductiveDay =
    completionsByWeekday[maxWeekday] > 0 ? WEEKDAY_NAMES[maxWeekday] : null;

  const categoryCounts = new Map<string, number>();
  for (const habit of activeHabits) {
    categoryCounts.set(habit.category, (categoryCounts.get(habit.category) ?? 0) + 1);
  }
  const categoryBreakdown = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    periodDays,
    habitSuccessRate: dueHabitDays === 0 ? 0 : Math.round((completedHabitDays / dueHabitDays) * 100),
    taskCompletionRate:
      windowTasks.length === 0
        ? 0
        : Math.round((completedWindowTasks.length / windowTasks.length) * 100),
    habitCompletions,
    tasksCompleted,
    longestStreak,
    mostProductiveDay,
    trend,
    categoryBreakdown,
  };
}
