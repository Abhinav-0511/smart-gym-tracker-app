import { useCallback, useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import {
  deleteAllReadNotifications,
  deleteNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import type { NotificationPage } from "@/types/notification";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (userId: string) => [...notificationKeys.all, "list", userId] as const,
  unread: (userId: string) => [...notificationKeys.all, "unread", userId] as const,
};

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";
  const listKey = notificationKeys.list(resolvedUserId);
  const unreadKey = notificationKeys.unread(resolvedUserId);

  const notificationsQuery = useInfiniteQuery({
    queryKey: listKey,
    queryFn: ({ pageParam }) => fetchNotifications(resolvedUserId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: Boolean(userId),
  });

  const unreadQuery = useQuery({
    queryKey: unreadKey,
    queryFn: () => fetchUnreadNotificationCount(resolvedUserId),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const refresh = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationKeys.list(resolvedUserId),
        }),
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unread(resolvedUserId),
        }),
      ]),
    [queryClient, resolvedUserId],
  );

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(resolvedUserId, notificationId),
    onMutate: async (notificationId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: unreadKey }),
      ]);
      const previousList =
        queryClient.getQueryData<InfiniteData<NotificationPage>>(listKey);
      const previousUnread = queryClient.getQueryData<number>(unreadKey);
      let changed = false;

      queryClient.setQueryData<InfiniteData<NotificationPage>>(listKey, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.map((item) => {
                  if (item.id !== notificationId || item.read) return item;
                  changed = true;
                  return { ...item, read: true };
                }),
              })),
            }
          : data,
      );
      if (changed) {
        queryClient.setQueryData<number>(
          unreadKey,
          Math.max(0, (previousUnread ?? 0) - 1),
        );
      }
      return { previousList, previousUnread };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(listKey, context?.previousList);
      queryClient.setQueryData(unreadKey, context?.previousUnread);
    },
    onSettled: refresh,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(resolvedUserId),
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: unreadKey }),
      ]);
      const previousList =
        queryClient.getQueryData<InfiniteData<NotificationPage>>(listKey);
      const previousUnread = queryClient.getQueryData<number>(unreadKey);
      queryClient.setQueryData<InfiniteData<NotificationPage>>(listKey, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.map((item) => ({ ...item, read: true })),
              })),
            }
          : data,
      );
      queryClient.setQueryData(unreadKey, 0);
      return { previousList, previousUnread };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(listKey, context?.previousList);
      queryClient.setQueryData(unreadKey, context?.previousUnread);
    },
    onSettled: refresh,
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) =>
      deleteNotification(resolvedUserId, notificationId),
    onSettled: refresh,
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: () => deleteAllReadNotifications(resolvedUserId),
    onSettled: refresh,
  });

  return {
    notificationsQuery,
    unreadQuery,
    markReadMutation,
    markAllReadMutation,
    deleteMutation,
    deleteAllReadMutation,
  };
}
