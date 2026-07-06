import type { Json } from "@/types/database";

export type NotificationType =
  | "workout_reminder"
  | "workout_started"
  | "workout_completed"
  | "workout_cancelled"
  | "personal_record"
  | "achievement_unlocked"
  | "profile_updated"
  | "avatar_updated"
  | "plan_created"
  | "plan_deleted"
  | "plan_activated"
  | "exercise_added"
  | "exercise_removed"
  | "exercise_created"
  | "weekly_summary"
  | "system";

export type NotificationPriority = "low" | "normal" | "high";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  icon: string;
  priority: NotificationPriority;
  createdAt: string;
  read: boolean;
  actionUrl: string | null;
  metadata: Json;
}

export interface NotificationPage {
  items: AppNotification[];
  nextOffset: number | null;
}

export type NotificationGroup =
  | "Today"
  | "Yesterday"
  | "This Week"
  | "Earlier";

export function getNotificationGroup(
  createdAt: string,
  now = new Date(),
): NotificationGroup {
  const date = new Date(createdAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysAgo = Math.floor((today.getTime() - target.getTime()) / 86_400_000);

  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return "This Week";
  return "Earlier";
}

export function notificationActionPage(actionUrl: string | null): string | null {
  const pages: Record<string, string> = {
    "/": "home",
    "/workout": "workout",
    "/plan": "plan",
    "/prs": "prs",
    "/progress": "progress",
    "/profile": "profile",
  };

  return actionUrl ? pages[actionUrl] ?? null : null;
}
