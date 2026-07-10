import { describe, expect, it } from "vitest";

import { computeHabitStats } from "@/features/productivity/lib/habit-stats";
import { addDays } from "@/features/productivity/lib/date-keys";
import type { Habit } from "@/features/productivity/types/habit";

const TODAY = "2026-07-10"; // a Friday (ISO weekday 5)

const daily: Pick<Habit, "frequency" | "customDays"> = {
  frequency: "daily",
  customDays: null,
};

const weekdays: Pick<Habit, "frequency" | "customDays"> = {
  frequency: "weekdays",
  customDays: null,
};

function lastNDays(n: number, endKey = TODAY): string[] {
  return Array.from({ length: n }, (_, index) => addDays(endKey, -index));
}

describe("computeHabitStats", () => {
  it("counts a consecutive daily streak ending today", () => {
    const stats = computeHabitStats({
      habit: daily,
      completedKeys: lastNDays(5),
      todayKey: TODAY,
      totalCompletions: 5,
      lastCompletedOn: TODAY,
    });

    expect(stats.currentStreak).toBe(5);
    expect(stats.longestStreak).toBe(5);
    expect(stats.completedToday).toBe(true);
  });

  it("keeps the streak intact when today is not yet completed (grace)", () => {
    const stats = computeHabitStats({
      habit: daily,
      completedKeys: lastNDays(3, addDays(TODAY, -1)), // through yesterday only
      todayKey: TODAY,
      totalCompletions: 3,
      lastCompletedOn: addDays(TODAY, -1),
    });

    expect(stats.currentStreak).toBe(3);
    expect(stats.completedToday).toBe(false);
  });

  it("breaks the streak when a past due day was missed", () => {
    // Completed today and two days ago, but missed yesterday.
    const stats = computeHabitStats({
      habit: daily,
      completedKeys: [TODAY, addDays(TODAY, -2)],
      todayKey: TODAY,
      totalCompletions: 2,
      lastCompletedOn: TODAY,
    });

    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(1);
  });

  it("ignores weekend gaps for a weekdays habit", () => {
    // Fri (today), Thu, Wed, Tue, Mon completed; the prior weekend is not due.
    const completed = [
      TODAY,
      addDays(TODAY, -1),
      addDays(TODAY, -2),
      addDays(TODAY, -3),
      addDays(TODAY, -4),
    ];
    const stats = computeHabitStats({
      habit: weekdays,
      completedKeys: completed,
      todayKey: TODAY,
      totalCompletions: 5,
      lastCompletedOn: TODAY,
    });

    expect(stats.currentStreak).toBe(5);
  });

  it("returns a zeroed streak with no completions", () => {
    const stats = computeHabitStats({
      habit: daily,
      completedKeys: [],
      todayKey: TODAY,
      totalCompletions: 0,
      lastCompletedOn: null,
    });

    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.completionRate).toBe(0);
  });

  it("computes completion rate over the trailing window", () => {
    // Completed 15 of the last 30 daily due days, excluding today (not done).
    const completed = Array.from({ length: 15 }, (_, index) =>
      addDays(TODAY, -(index + 1)),
    );
    const stats = computeHabitStats({
      habit: daily,
      completedKeys: completed,
      todayKey: TODAY,
      totalCompletions: 15,
      lastCompletedOn: addDays(TODAY, -1),
    });

    // 15 completed out of 29 elapsed due days (today excluded as in-progress).
    expect(stats.completionRate).toBe(Math.round((15 / 29) * 100));
  });
});
