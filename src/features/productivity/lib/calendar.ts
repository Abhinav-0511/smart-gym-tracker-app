// Pure helpers for the monthly calendar: build a 6×7 day grid and aggregate the
// tasks and habits that fall on each day.

import { addDays, isoWeekdayOfKey, parseDateKey, toDateKey } from "@/features/productivity/lib/date-keys";
import { isHabitDueOn } from "@/features/productivity/types/habit";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import type { Task } from "@/features/productivity/types/task";

export interface CalendarDay {
  key: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  habitsDue: HabitWithHistory[];
  completedTaskCount: number;
  completedHabitCount: number;
}

/** First day of the month `key` belongs to, as a YYYY-MM-01 key. */
export function monthStartKey(key: string): string {
  return `${key.slice(0, 7)}-01`;
}

export function shiftMonth(monthKey: string, delta: number): string {
  const date = parseDateKey(monthStartKey(monthKey));
  date.setUTCMonth(date.getUTCMonth() + delta);
  return toDateKey(date);
}

export function formatMonthLabel(monthKey: string): string {
  return parseDateKey(monthStartKey(monthKey)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Ordered weekday headers starting Monday. */
export const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Build a 6-week grid (42 cells) covering the month of `monthKey`, padded with
 * the trailing/leading days of adjacent months, and attach each day's items.
 */
export function buildCalendarGrid(
  monthKey: string,
  tasks: Task[],
  habits: HabitWithHistory[],
  todayKey: string,
): CalendarDay[] {
  const monthStart = monthStartKey(monthKey);
  const month = monthStart.slice(0, 7);

  // Snap back to the Monday on/before the 1st.
  let gridStart = monthStart;
  while (isoWeekdayOfKey(gridStart) !== 1) gridStart = addDays(gridStart, -1);

  const tasksByDay = new Map<string, Task[]>();
  const completedTaskByDay = new Map<string, number>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    if (task.status === "completed") {
      completedTaskByDay.set(task.dueDate, (completedTaskByDay.get(task.dueDate) ?? 0) + 1);
    }
    if (task.status === "pending") {
      const list = tasksByDay.get(task.dueDate) ?? [];
      list.push(task);
      tasksByDay.set(task.dueDate, list);
    }
  }

  return Array.from({ length: 42 }, (_, index): CalendarDay => {
    const key = addDays(gridStart, index);
    const date = parseDateKey(key);
    const habitsDue = habits.filter(
      (habit) => habit.status === "active" && isHabitDueOn(habit, date),
    );
    const completedHabitCount = habitsDue.filter((habit) =>
      habit.recentCompletedKeys.includes(key),
    ).length;

    return {
      key,
      dayOfMonth: date.getUTCDate(),
      inMonth: key.slice(0, 7) === month,
      isToday: key === todayKey,
      tasks: tasksByDay.get(key) ?? [],
      habitsDue,
      completedTaskCount: completedTaskByDay.get(key) ?? 0,
      completedHabitCount,
    };
  });
}
