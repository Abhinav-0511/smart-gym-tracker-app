import { describe, expect, it } from "vitest";

import { compareTasks, isTaskInView } from "@/features/productivity/lib/task-format";
import type { Task } from "@/features/productivity/types/task";

const TODAY = "2026-07-10";
const NOW = new Date("2026-07-10T12:00:00.000Z");

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "t1",
    userId: "u1",
    title: overrides.title ?? "Task",
    description: null,
    priority: overrides.priority ?? "medium",
    dueDate: overrides.dueDate ?? null,
    dueTime: null,
    deadline: overrides.deadline ?? null,
    repeat: "none",
    reminderEnabled: false,
    reminderAt: null,
    location: null,
    notes: null,
    attachments: [],
    status: overrides.status ?? "pending",
    completedAt: overrides.completedAt ?? null,
    createdAt: overrides.createdAt ?? "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

describe("isTaskInView", () => {
  it("includes today's tasks and overdue tasks in Today", () => {
    const dueToday = makeTask({ dueDate: TODAY });
    const overdue = makeTask({ id: "t2", dueDate: "2026-07-08" });
    const future = makeTask({ id: "t3", dueDate: "2026-07-20" });

    expect(isTaskInView(dueToday, "today", TODAY, NOW)).toBe(true);
    expect(isTaskInView(overdue, "today", TODAY, NOW)).toBe(true);
    expect(isTaskInView(future, "today", TODAY, NOW)).toBe(false);
  });

  it("buckets tomorrow and this-week correctly", () => {
    const tomorrow = makeTask({ dueDate: "2026-07-11" });
    expect(isTaskInView(tomorrow, "tomorrow", TODAY, NOW)).toBe(true);
    // Today is Friday; end of ISO week is Sunday 2026-07-12.
    expect(isTaskInView(tomorrow, "week", TODAY, NOW)).toBe(true);
    const nextWeek = makeTask({ dueDate: "2026-07-14" });
    expect(isTaskInView(nextWeek, "week", TODAY, NOW)).toBe(false);
  });

  it("treats undated tasks as upcoming, not today", () => {
    const someday = makeTask({ dueDate: null });
    expect(isTaskInView(someday, "upcoming", TODAY, NOW)).toBe(true);
    expect(isTaskInView(someday, "today", TODAY, NOW)).toBe(false);
  });

  it("only shows completed tasks in Completed", () => {
    const done = makeTask({ status: "completed", completedAt: NOW.toISOString(), dueDate: TODAY });
    expect(isTaskInView(done, "completed", TODAY, NOW)).toBe(true);
    expect(isTaskInView(done, "today", TODAY, NOW)).toBe(false);
  });
});

describe("compareTasks", () => {
  it("ranks overdue before on-time, then by priority", () => {
    const overdue = makeTask({ id: "a", dueDate: "2026-07-08", priority: "low" });
    const todayUrgent = makeTask({ id: "b", dueDate: TODAY, priority: "urgent" });

    expect(compareTasks(overdue, todayUrgent, NOW)).toBeLessThan(0);
  });

  it("orders by priority when due dates match", () => {
    const high = makeTask({ id: "a", dueDate: TODAY, priority: "high" });
    const low = makeTask({ id: "b", dueDate: TODAY, priority: "low" });

    expect(compareTasks(high, low, NOW)).toBeLessThan(0);
  });
});
