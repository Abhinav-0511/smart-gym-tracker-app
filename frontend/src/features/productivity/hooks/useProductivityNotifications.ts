import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useHabits } from "@/features/productivity/hooks/useHabits";
import { useTasks } from "@/features/productivity/hooks/useTasks";
import {
  BrowserNotificationChannel,
  buildDueNotifications,
  NotificationService,
} from "@/features/productivity/lib/notification-scheduler";
import {
  deleteProductivityNotification,
  fetchProductivityNotifications,
  markAllProductivityNotificationsRead,
  markProductivityNotificationRead,
} from "@/features/productivity/services/productivity-notifications";

export const productivityNotificationKeys = {
  all: ["productivity-notifications"] as const,
  list: (userId: string) => [...productivityNotificationKeys.all, userId] as const,
};

/** Minimum spacing between local generation runs. */
const SYNC_THROTTLE_MS = 60_000;

function localTimeInZone(now: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

export function useProductivityNotifications(
  userId: string | undefined,
  timezone: string,
) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";
  const listKey = productivityNotificationKeys.list(resolvedUserId);

  // Reuse the shared caches to know what to generate notifications for.
  const habits = useHabits(userId, timezone, false);
  const tasks = useTasks(userId, timezone, false);
  const todayKey = tasks.todayKey;

  const notificationsQuery = useQuery({
    queryKey: listKey,
    queryFn: () => fetchProductivityNotifications(resolvedUserId),
    enabled: Boolean(userId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: productivityNotificationKeys.all });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markProductivityNotificationRead(id),
    onSuccess: invalidate,
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllProductivityNotificationsRead(resolvedUserId),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProductivityNotification(id),
    onSuccess: invalidate,
  });

  const lastSyncRef = useRef(0);
  const habitData = habits.habitsQuery.data;
  const taskData = tasks.tasksQuery.data;

  const runSync = useCallback(async () => {
    if (!userId || !habitData || !taskData) return;
    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_THROTTLE_MS) return;
    lastSyncRef.current = now;

    const service = new NotificationService(userId, [new BrowserNotificationChannel()]);
    const nowDate = new Date();
    const inputs = buildDueNotifications({
      tasks: taskData,
      habits: habitData,
      todayKey,
      now: nowDate,
      localTime: localTimeInZone(nowDate, timezone),
    });

    if (inputs.length === 0) return;
    await service.deliverMany(inputs);
    void queryClient.invalidateQueries({ queryKey: listKey });
    // listKey is derived from userId, which gates this callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, habitData, taskData, todayKey, timezone, queryClient]);

  // Generate on data changes and on a periodic tick (throttled internally).
  useEffect(() => {
    void runSync();
    const interval = window.setInterval(() => void runSync(), SYNC_THROTTLE_MS * 5);
    return () => window.clearInterval(interval);
  }, [runSync]);

  const unreadCount = useMemo(
    () => (notificationsQuery.data ?? []).filter((item) => !item.read).length,
    [notificationsQuery.data],
  );

  return {
    notificationsQuery,
    unreadCount,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllMutation.mutate(),
    deleteNotification: (id: string) => deleteMutation.mutate(id),
  };
}
