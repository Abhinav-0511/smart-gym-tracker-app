// View grouping, labels, and sorting for the Task Planner. Pure and testable.

import { addDays, isoWeekdayOfKey } from "@/features/productivity/lib/date-keys";
import {
  getTaskDerivedStatus,
  TASK_PRIORITY_RANK,
  type Task,
  type TaskDerivedStatus,
  type TaskPriority,
  type TaskRepeat,
} from "@/features/productivity/types/task";

export type TaskView = "today" | "tomorrow" | "week" | "upcoming" | "completed";

export const TASK_VIEWS: { id: TaskView; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "week", label: "This Week" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const REPEAT_LABELS: Record<TaskRepeat, string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const STATUS_LABELS: Record<TaskDerivedStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  archived: "Archived",
  overdue: "Overdue",
};

export function getStatusLabel(status: TaskDerivedStatus): string {
  return STATUS_LABELS[status];
}

/** The end of the ISO week (Sunday) containing `todayKey`, as a date key. */
function endOfWeekKey(todayKey: string): string {
  const weekday = isoWeekdayOfKey(todayKey); // 1..7
  return addDays(todayKey, 7 - weekday);
}

/**
 * Whether a task belongs in a given view. Views are date-scoped buckets except
 * "completed", which collects every completed task regardless of date.
 */
export function isTaskInView(
  task: Task,
  view: TaskView,
  todayKey: string,
  now = new Date(),
): boolean {
  const derived = getTaskDerivedStatus(task, now);

  if (view === "completed") return task.status === "completed";
  // Non-completed views never show completed/cancelled tasks.
  if (task.status === "completed" || task.status === "cancelled") return false;

  const dueKey = task.dueDate;

  switch (view) {
    case "today":
      // Anything due today plus anything already overdue needs attention now.
      return dueKey === todayKey || derived === "overdue";
    case "tomorrow":
      return dueKey === addDays(todayKey, 1);
    case "week":
      return dueKey !== null && dueKey >= todayKey && dueKey <= endOfWeekKey(todayKey);
    case "upcoming":
      // Future-dated or someday (no date) tasks that aren't overdue.
      return dueKey === null || dueKey > todayKey;
    default:
      return false;
  }
}

/**
 * Sort comparator: overdue first, then by due date, then by priority (urgent
 * first), then by creation time.
 */
export function compareTasks(a: Task, b: Task, now = new Date()): number {
  const aOverdue = getTaskDerivedStatus(a, now) === "overdue";
  const bOverdue = getTaskDerivedStatus(b, now) === "overdue";
  if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }

  const priorityDelta = TASK_PRIORITY_RANK[b.priority] - TASK_PRIORITY_RANK[a.priority];
  if (priorityDelta !== 0) return priorityDelta;

  return a.createdAt < b.createdAt ? 1 : -1;
}

export type TaskSort = "smart" | "priority" | "due" | "created";

export const TASK_SORTS: { id: TaskSort; label: string }[] = [
  { id: "smart", label: "Smart" },
  { id: "priority", label: "Priority" },
  { id: "due", label: "Due date" },
  { id: "created", label: "Recently added" },
];

export function sortTasks(tasks: Task[], sort: TaskSort, now = new Date()): Task[] {
  const copy = [...tasks];
  switch (sort) {
    case "priority":
      return copy.sort(
        (a, b) => TASK_PRIORITY_RANK[b.priority] - TASK_PRIORITY_RANK[a.priority],
      );
    case "due":
      return copy.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
      });
    case "created":
      return copy.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    case "smart":
    default:
      return copy.sort((a, b) => compareTasks(a, b, now));
  }
}
