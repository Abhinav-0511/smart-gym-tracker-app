// Local notification generation + a transport abstraction that is push-ready.
//
// `buildDueNotifications` is a pure function that decides which notifications
// *should* exist given the current tasks/habits and clock. `NotificationService`
// persists them (in-app) and fans genuinely-new ones out to transient channels
// (the browser now, a push service later) — all behind one interface, so adding
// push is a new channel, not a change to any caller.

import { addDays, isoWeekdayOfKey, parseDateKey } from "@/features/productivity/lib/date-keys";
import { createProductivityNotification } from "@/features/productivity/services/productivity-notifications";
import type { CreateProductivityNotificationInput } from "@/features/productivity/types/notification";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import { getTaskDerivedStatus, type Task } from "@/features/productivity/types/task";

const TASKS_URL = "/productivity/tasks";
const HABITS_URL = "/productivity/habits";
const DASHBOARD_URL = "/productivity";
const DAY_MS = 24 * 60 * 60 * 1000;

export interface NotificationContext {
  tasks: Task[];
  habits: HabitWithHistory[];
  todayKey: string;
  now: Date;
  /** Local wall-clock time as `HH:MM`. */
  localTime: string;
}

function isLastDayOfMonth(todayKey: string): boolean {
  return addDays(todayKey, 1).slice(0, 7) !== todayKey.slice(0, 7);
}

function mondayKey(todayKey: string): string {
  let cursor = todayKey;
  while (isoWeekdayOfKey(cursor) !== 1) cursor = addDays(cursor, -1);
  return cursor;
}

/** Decide the full set of notifications that should currently exist. Pure. */
export function buildDueNotifications(
  context: NotificationContext,
): CreateProductivityNotificationInput[] {
  const { tasks, habits, todayKey, now, localTime } = context;
  const result: CreateProductivityNotificationInput[] = [];
  const pending = tasks.filter((task) => task.status === "pending");

  for (const task of pending) {
    const derived = getTaskDerivedStatus(task, now);

    if (derived === "overdue") {
      result.push({
        type: "task_overdue",
        title: "Task overdue",
        message: `“${task.title}” is past due.`,
        icon: "alert-triangle",
        priority: "high",
        actionUrl: TASKS_URL,
        metadata: { task_id: task.id },
        dedupeKey: `task-overdue:${task.id}:${todayKey}`,
      });
    } else if (task.deadline) {
      const untilDeadline = new Date(task.deadline).getTime() - now.getTime();
      if (untilDeadline > 0 && untilDeadline <= DAY_MS) {
        result.push({
          type: "task_due_soon",
          title: "Task due soon",
          message: `“${task.title}” is due within a day.`,
          icon: "clock",
          priority: "normal",
          actionUrl: TASKS_URL,
          metadata: { task_id: task.id },
          dedupeKey: `task-due-soon:${task.id}:${task.deadline.slice(0, 10)}`,
        });
      }
    }

    if (task.reminderEnabled && task.reminderAt && new Date(task.reminderAt) <= now) {
      result.push({
        type: "task_reminder",
        title: "Task reminder",
        message: `Reminder: “${task.title}”.`,
        icon: "bell",
        priority: "normal",
        actionUrl: TASKS_URL,
        metadata: { task_id: task.id },
        dedupeKey: `task-reminder:${task.id}:${task.reminderAt}`,
      });
    }
  }

  for (const habit of habits) {
    if (
      habit.status === "active"
      && habit.reminderEnabled
      && habit.reminderTime
      && habit.reminderTime.slice(0, 5) <= localTime
      && !habit.stats.completedToday
    ) {
      result.push({
        type: "habit_reminder",
        title: "Habit reminder",
        message: `Time for “${habit.title}”.`,
        icon: "bell",
        priority: "normal",
        actionUrl: HABITS_URL,
        metadata: { habit_id: habit.id },
        dedupeKey: `habit-reminder:${habit.id}:${todayKey}`,
      });
    }
  }

  const dueHabitsToday = habits.filter(
    (habit) => habit.status === "active" && !habit.stats.completedToday,
  ).length;
  const pendingToday = pending.filter(
    (task) => task.dueDate === todayKey || getTaskDerivedStatus(task, now) === "overdue",
  ).length;

  if (dueHabitsToday > 0 || pendingToday > 0) {
    result.push({
      type: "daily_summary",
      title: "Today’s plan",
      message: `${dueHabitsToday} habit${dueHabitsToday === 1 ? "" : "s"} and ${pendingToday} task${pendingToday === 1 ? "" : "s"} need attention today.`,
      icon: "sunrise",
      priority: "low",
      actionUrl: DASHBOARD_URL,
      dedupeKey: `daily-summary:${todayKey}`,
    });
  }

  if (isoWeekdayOfKey(todayKey) === 7) {
    result.push({
      type: "weekly_summary",
      title: "Weekly review",
      message: "Your week wrapped up — check your progress and plan ahead.",
      icon: "calendar",
      priority: "low",
      actionUrl: DASHBOARD_URL,
      dedupeKey: `weekly-summary:${mondayKey(todayKey)}`,
    });
  }

  if (isLastDayOfMonth(todayKey)) {
    result.push({
      type: "monthly_summary",
      title: "Monthly review",
      message: `${parseDateKey(todayKey).toLocaleDateString(undefined, { month: "long", timeZone: "UTC" })} is done — review your month.`,
      icon: "calendar-days",
      priority: "low",
      actionUrl: DASHBOARD_URL,
      dedupeKey: `monthly-summary:${todayKey.slice(0, 7)}`,
    });
  }

  return result;
}

/** A transport that delivers a genuinely-new notification somewhere transient. */
export interface TransientNotificationChannel {
  deliver(input: CreateProductivityNotificationInput): Promise<void>;
}

/** Fires an OS notification via the Web Notifications API when permitted. */
export class BrowserNotificationChannel implements TransientNotificationChannel {
  async deliver(input: CreateProductivityNotificationInput): Promise<void> {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      new Notification(input.title, { body: input.message });
    } catch {
      // OS notification is best-effort; the in-app record is the source of truth.
    }
  }
}

/**
 * Persists notifications in-app and fans newly-created ones out to transient
 * channels. A future push transport implements TransientNotificationChannel and
 * is passed in here — no caller changes required.
 */
export class NotificationService {
  constructor(
    private readonly userId: string,
    private readonly channels: TransientNotificationChannel[] = [],
  ) {}

  async deliver(input: CreateProductivityNotificationInput): Promise<void> {
    const created = await createProductivityNotification(this.userId, input);
    if (!created) return;
    await Promise.all(this.channels.map((channel) => channel.deliver(input).catch(() => undefined)));
  }

  async deliverMany(inputs: CreateProductivityNotificationInput[]): Promise<void> {
    for (const input of inputs) {
      await this.deliver(input);
    }
  }
}
