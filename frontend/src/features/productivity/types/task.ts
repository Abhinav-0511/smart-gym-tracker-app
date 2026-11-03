// Domain model for the Task Planner. Mirrors the `tasks` table. The "overdue"
// state is derived from the clock (see getTaskDerivedStatus) rather than stored,
// so it can never drift out of sync.

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskRepeat = "none" | "daily" | "weekly" | "monthly" | "yearly";

/** Persisted status values. */
export type TaskStatus = "pending" | "completed" | "cancelled" | "archived";

/** Effective status shown to the user, including the derived "overdue". */
export type TaskDerivedStatus = TaskStatus | "overdue";

export interface TaskAttachment {
  name: string;
  url: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  dueTime: string | null;
  deadline: string | null;
  repeat: TaskRepeat;
  reminderEnabled: boolean;
  reminderAt: string | null;
  location: string | null;
  notes: string | null;
  attachments: TaskAttachment[];
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
  dueTime?: string | null;
  deadline?: string | null;
  repeat: TaskRepeat;
  reminderEnabled: boolean;
  reminderAt?: string | null;
  location?: string | null;
  notes?: string | null;
  attachments?: TaskAttachment[];
}

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: TaskStatus;
};

export const TASK_PRIORITIES: readonly TaskPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export const TASK_REPEATS: readonly TaskRepeat[] = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

/** Numeric rank for sorting by priority (higher = more urgent). */
export const TASK_PRIORITY_RANK: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3,
};

/**
 * Resolve a task's effective status. A pending task whose deadline (or due date)
 * has passed is reported as "overdue".
 */
export function getTaskDerivedStatus(
  task: Pick<Task, "status" | "deadline" | "dueDate">,
  now = new Date(),
): TaskDerivedStatus {
  if (task.status !== "pending") return task.status;

  if (task.deadline && new Date(task.deadline).getTime() < now.getTime()) {
    return "overdue";
  }

  if (task.dueDate) {
    // Treat a due date as overdue once its calendar day is fully in the past.
    const endOfDueDay = new Date(`${task.dueDate}T23:59:59.999`);
    if (endOfDueDay.getTime() < now.getTime()) return "overdue";
  }

  return "pending";
}
