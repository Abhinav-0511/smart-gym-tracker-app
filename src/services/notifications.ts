import { supabase } from "@/lib/supabase";
import type {
  AppNotification,
  NotificationPage,
  NotificationPriority,
  NotificationType,
} from "@/types/notification";

export const NOTIFICATION_PAGE_SIZE = 20;

function mapNotification(row: {
  action_url: string | null;
  created_at: string;
  icon: string;
  id: string;
  message: string;
  metadata: AppNotification["metadata"];
  priority: string;
  read_at: string | null;
  title: string;
  type: string;
  user_id: string;
}): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type as NotificationType,
    icon: row.icon,
    priority: row.priority as NotificationPriority,
    createdAt: row.created_at,
    read: row.read_at !== null,
    actionUrl: row.action_url,
    metadata: row.metadata,
  };
}

export async function fetchNotifications(
  userId: string,
  offset = 0,
  pageSize = NOTIFICATION_PAGE_SIZE,
): Promise<NotificationPage> {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, user_id, title, message, type, icon, priority, created_at, read_at, action_url, metadata",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) throw error;
  const items = (data ?? []).map(mapNotification);
  return {
    items,
    nextOffset: items.length === pageSize ? offset + pageSize : null,
  };
}

export async function fetchUnreadNotificationCount(
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", notificationId)
    .is("read_at", null);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
}

export async function deleteNotification(
  userId: string,
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .eq("id", notificationId);

  if (error) throw error;
}

export async function deleteAllReadNotifications(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .not("read_at", "is", null);

  if (error) throw error;
}
