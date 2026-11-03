import { describe, expect, it } from "vitest";

import { buildDueNotifications } from "@/features/productivity/lib/notification-scheduler";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import type { Task } from "@/features/productivity/types/task";

const TODAY = "2026-07-10"; // Friday
const NOW = new Date("2026-07-10T12:00:00.000Z");

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

function makeHabit(overrides: Partial<HabitWithHistory>): HabitWithHistory {
  return {
    id: "h1",
    userId: "u1",
    title: "Meditate",
    description: null,
    category: "mindfulness",
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

const baseContext = { todayKey: TODAY, now: NOW, localTime: "12:00" };

describe("buildDueNotifications", () => {
  it("emits an overdue notification with a per-day dedupe key", () => {
    const task = makeTask({ dueDate: "2026-07-08" });
    const result = buildDueNotifications({ ...baseContext, tasks: [task], habits: [] });

    const overdue = result.find((item) => item.type === "task_overdue");
    expect(overdue).toBeDefined();
    expect(overdue?.dedupeKey).toBe(`task-overdue:${task.id}:${TODAY}`);
  });

  it("emits a due-soon notification for a deadline within 24h", () => {
    const task = makeTask({ deadline: "2026-07-10T18:00:00.000Z" });
    const result = buildDueNotifications({ ...baseContext, tasks: [task], habits: [] });
    expect(result.some((item) => item.type === "task_due_soon")).toBe(true);
  });

  it("reminds about a due habit past its reminder time", () => {
    const habit = makeHabit({ reminderEnabled: true, reminderTime: "08:00:00" });
    const result = buildDueNotifications({ ...baseContext, tasks: [], habits: [habit] });
    expect(result.some((item) => item.type === "habit_reminder")).toBe(true);
  });

  it("does not remind about an already-completed habit", () => {
    const habit = makeHabit({
      reminderEnabled: true,
      reminderTime: "08:00:00",
      stats: {
        currentStreak: 1,
        longestStreak: 1,
        completionRate: 100,
        totalCompletions: 1,
        completedToday: true,
        lastCompletedOn: TODAY,
      },
    });
    const result = buildDueNotifications({ ...baseContext, tasks: [], habits: [habit] });
    expect(result.some((item) => item.type === "habit_reminder")).toBe(false);
  });

  it("emits a daily summary when there is work due today", () => {
    const task = makeTask({ dueDate: TODAY });
    const result = buildDueNotifications({ ...baseContext, tasks: [task], habits: [] });
    const summary = result.find((item) => item.type === "daily_summary");
    expect(summary?.dedupeKey).toBe(`daily-summary:${TODAY}`);
  });

  it("produces nothing for an empty, caught-up day", () => {
    const result = buildDueNotifications({ ...baseContext, tasks: [], habits: [] });
    // Friday is not week/month end, so no summaries either.
    expect(result).toHaveLength(0);
  });
});
