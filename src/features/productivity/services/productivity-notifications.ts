import { supabase } from "@/lib/supabase";
import type { Json, Tables } from "@/types/database";
import type {
  CreateProductivityNotificationInput,
  ProductivityNotification,
  ProductivityNotificationPriority,
  ProductivityNotificationType,
} from "@/features/productivity/types/notification";

export const PRODUCTIVITY_NOTIFICATION_LIMIT = 50;

type SupabaseLikeError = { code?: string; message: string };

function throwIfError(error: SupabaseLikeError | null): void {
  if (error) throw new Error(error.message);
}

function mapNotification(row: Tables<"productivity_notifications">): ProductivityNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as ProductivityNotificationType,
    title: row.title,
    message: row.message,
    icon: row.icon,
    priority: row.priority as ProductivityNotificationPriority,
    actionUrl: row.action_url,
    metadata: row.metadata,
    scheduledFor: row.scheduled_for,
    read: row.read_at !== null,
    createdAt: row.created_at,
  };
}

export async function fetchProductivityNotifications(
  userId: string,
): Promise<ProductivityNotification[]> {
  const { data, error } = await supabase
    .from("productivity_notifications")
    .select("*")
    .eq("user_id", userId)
    // Scheduled-for-the-future notifications stay hidden until their time.
    .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(PRODUCTIVITY_NOTIFICATION_LIMIT);

  throwIfError(error);
  return (data ?? []).map(mapNotification);
}

/**
 * Insert a notification, ignoring duplicates that share a dedupe key. This makes
 * the local generator idempotent — re-running it never spams the user. Returns
 * whether a new row was actually created (false when a duplicate was ignored),
 * so transient channels (OS/push) only fire for genuinely new notifications.
 */
export async function createProductivityNotification(
  userId: string,
  input: CreateProductivityNotificationInput,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("productivity_notifications")
    .upsert(
      {
        user_id: userId,
        type: input.type,
        title: input.title,
        message: input.message,
        icon: input.icon,
        priority: input.priority ?? "normal",
        action_url: input.actionUrl ?? null,
        metadata: (input.metadata ?? {}) as Json,
        scheduled_for: input.scheduledFor ?? null,
        dedupe_key: input.dedupeKey ?? null,
      },
      { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
    )
    .select("id");

  throwIfError(error);
  return (data?.length ?? 0) > 0;
}

export async function markProductivityNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("productivity_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  throwIfError(error);
}

export async function markAllProductivityNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("productivity_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  throwIfError(error);
}

export async function deleteProductivityNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from("productivity_notifications")
    .delete()
    .eq("id", id);

  throwIfError(error);
}
