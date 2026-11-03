// Domain model for Productivity workspace notifications. Kept separate from the
// Fitness `AppNotification` so the two workspaces stay isolated; a future
// NotificationService can unify them at the service layer.

import type { Json } from "@/types/database";

export type ProductivityNotificationType =
  | "task_reminder"
  | "task_due_soon"
  | "task_overdue"
  | "habit_reminder"
  | "daily_summary"
  | "weekly_summary"
  | "monthly_summary"
  | "system";

export type ProductivityNotificationPriority = "low" | "normal" | "high";

export interface ProductivityNotification {
  id: string;
  userId: string;
  type: ProductivityNotificationType;
  title: string;
  message: string;
  icon: string;
  priority: ProductivityNotificationPriority;
  actionUrl: string | null;
  metadata: Json;
  /** When set, surface at/after this instant (push-notification ready). */
  scheduledFor: string | null;
  read: boolean;
  createdAt: string;
}

export interface CreateProductivityNotificationInput {
  type: ProductivityNotificationType;
  title: string;
  message: string;
  icon: string;
  priority?: ProductivityNotificationPriority;
  actionUrl?: string | null;
  metadata?: Json;
  scheduledFor?: string | null;
  dedupeKey?: string | null;
}
