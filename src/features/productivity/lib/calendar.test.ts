import { describe, expect, it } from "vitest";

import { buildCalendarGrid } from "@/features/productivity/lib/calendar";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import type { Task } from "@/features/productivity/types/task";

const TODAY = "2026-07-10";

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

describe("buildCalendarGrid", () => {
  it("produces a 42-cell grid starting on Monday", () => {
    const grid = buildCalendarGrid("2026-07-01", [], [], TODAY);
    expect(grid).toHaveLength(42);
    // July 1 2026 is a Wednesday, so the grid starts Monday June 29.
    expect(grid[0].key).toBe("2026-06-29");
    expect(grid[0].inMonth).toBe(false);
  });

  it("flags today and places pending tasks on their due day", () => {
    const task = makeTask({ dueDate: TODAY });
    const grid = buildCalendarGrid("2026-07-01", [task], [], TODAY);
    const todayCell = grid.find((day) => day.key === TODAY);

    expect(todayCell?.isToday).toBe(true);
    expect(todayCell?.inMonth).toBe(true);
    expect(todayCell?.tasks.map((item) => item.id)).toContain("t1");
  });

  it("counts habit completions for a day", () => {
    const habit = makeHabit({ recentCompletedKeys: [TODAY] });
    const grid = buildCalendarGrid("2026-07-01", [], [habit], TODAY);
    const todayCell = grid.find((day) => day.key === TODAY);

    expect(todayCell?.habitsDue).toHaveLength(1);
    expect(todayCell?.completedHabitCount).toBe(1);
  });

  it("keeps completed tasks out of the pending list but counts them", () => {
    const done = makeTask({ id: "done", dueDate: TODAY, status: "completed", completedAt: `${TODAY}T09:00:00.000Z` });
    const grid = buildCalendarGrid("2026-07-01", [done], [], TODAY);
    const todayCell = grid.find((day) => day.key === TODAY);

    expect(todayCell?.tasks).toHaveLength(0);
    expect(todayCell?.completedTaskCount).toBe(1);
  });
});
