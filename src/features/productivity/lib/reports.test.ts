import { describe, expect, it } from "vitest";

import { buildProductivityReport } from "@/features/productivity/lib/reports";
import { addDays } from "@/features/productivity/lib/date-keys";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import type { Task } from "@/features/productivity/types/task";

const TODAY = "2026-07-10";

function makeHabit(overrides: Partial<HabitWithHistory>): HabitWithHistory {
  return {
    id: "h1",
    userId: "u1",
    title: "Habit",
    description: null,
    category: "health",
    icon: "circle-check",
    color: "blue",
    frequency: "daily",
    customDays: null,
    targetValue: null,
    unit: null,
    reminderEnabled: false,
    reminderTime: null,
    status: "active",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    recentCompletedKeys: [],
    stats: {
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      totalCompletions: 0,
      completedToday: false,
      lastCompletedOn: null,
    },
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    userId: "u1",
    title: "Task",
    description: null,
    priority: "medium",
    dueDate: null,
    dueTime: null,
    deadline: null,
    repeat: "none",
    reminderEnabled: false,
    reminderAt: null,
    location: null,
    notes: null,
    attachments: [],
    status: "pending",
    completedAt: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildProductivityReport", () => {
  it("computes habit success rate over the window", () => {
    // Daily habit completed on 4 of the last 7 days.
    const completed = [0, 1, 2, 3].map((offset) => addDays(TODAY, -offset));
    const habit = makeHabit({ recentCompletedKeys: completed });

    const report = buildProductivityReport({
      habits: [habit],
      tasks: [],
      todayKey: TODAY,
      periodDays: 7,
      timezone: "UTC",
    });

    expect(report.habitSuccessRate).toBe(Math.round((4 / 7) * 100));
    expect(report.habitCompletions).toBe(4);
    expect(report.trend).toHaveLength(7);
  });

  it("computes task completion rate for tasks due in the window", () => {
    const doneTask = makeTask({
      id: "a",
      dueDate: TODAY,
      status: "completed",
      completedAt: `${TODAY}T09:00:00.000Z`,
    });
    const openTask = makeTask({ id: "b", dueDate: addDays(TODAY, -2) });

    const report = buildProductivityReport({
      habits: [],
      tasks: [doneTask, openTask],
      todayKey: TODAY,
      periodDays: 7,
      timezone: "UTC",
    });

    expect(report.taskCompletionRate).toBe(50);
    expect(report.tasksCompleted).toBe(1);
  });

  it("breaks habits down by category and reports the longest streak", () => {
    const report = buildProductivityReport({
      habits: [
        makeHabit({ id: "a", category: "fitness", stats: { ...makeHabit({}).stats, longestStreak: 9 } }),
        makeHabit({ id: "b", category: "fitness" }),
        makeHabit({ id: "c", category: "learning" }),
      ],
      tasks: [],
      todayKey: TODAY,
      periodDays: 30,
      timezone: "UTC",
    });

    expect(report.longestStreak).toBe(9);
    expect(report.categoryBreakdown[0]).toEqual({ category: "fitness", count: 2 });
  });

  it("returns zeroed metrics with no data", () => {
    const report = buildProductivityReport({
      habits: [],
      tasks: [],
      todayKey: TODAY,
      periodDays: 7,
      timezone: "UTC",
    });

    expect(report.habitSuccessRate).toBe(0);
    expect(report.taskCompletionRate).toBe(0);
    expect(report.mostProductiveDay).toBeNull();
  });
});
