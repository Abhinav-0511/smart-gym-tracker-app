import { useMemo, useState, type ComponentType } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Award,
  Bell,
  Check,
  CheckCheck,
  CircleCheck,
  CircleX,
  ClipboardPlus,
  Dumbbell,
  Image,
  Info,
  MinusCircle,
  PlusCircle,
  Sparkles,
  Trash2,
  Trophy,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import {
  getNotificationGroup,
  notificationActionPage,
  type AppNotification,
  type NotificationGroup,
} from "@/types/notification";

interface NotificationCenterProps {
  userId: string | undefined;
  onNavigate: (page: string) => void;
}

const icons: Record<string, ComponentType<{ className?: string }>> = {
  award: Award,
  "circle-check": CircleCheck,
  "circle-x": CircleX,
  "clipboard-plus": ClipboardPlus,
  dumbbell: Dumbbell,
  image: Image,
  "minus-circle": MinusCircle,
  "plus-circle": PlusCircle,
  sparkles: Sparkles,
  "trash-2": Trash2,
  trophy: Trophy,
  "user-check": UserCheck,
};

const groupOrder: NotificationGroup[] = [
  "Today",
  "Yesterday",
  "This Week",
  "Earlier",
];

function NotificationItem({
  notification,
  onDelete,
  onOpen,
  onRead,
}: {
  notification: AppNotification;
  onDelete: () => void;
  onOpen: () => void;
  onRead: () => void;
}) {
  const Icon = icons[notification.icon] ?? Info;

  return (
    <article
      className={cn(
        "group relative rounded-xl border p-3 transition-colors",
        notification.read
          ? "border-border/50 bg-card/40"
          : "border-primary/25 bg-primary/[0.06]",
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            notification.priority === "high"
              ? "bg-primary/15 text-primary"
              : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h4 className="flex-1 text-sm font-bold text-foreground">
              {notification.title}
            </h4>
            {!notification.read && (
              <span
                aria-label="Unread"
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
              />
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {notification.message}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <span className="mr-auto text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
            {!notification.read && (
              <Button
                aria-label={`Mark ${notification.title} as read`}
                className="h-7 px-2 text-[11px]"
                onClick={onRead}
                size="sm"
                variant="ghost"
              >
                <Check className="h-3.5 w-3.5" />
                Read
              </Button>
            )}
            {notification.actionUrl && (
              <Button
                className="h-7 px-2 text-[11px]"
                onClick={onOpen}
                size="sm"
                variant="ghost"
              >
                Open
              </Button>
            )}
            <Button
              aria-label={`Delete ${notification.title}`}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function NotificationCenter({
  userId,
  onNavigate,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const {
    notificationsQuery,
    unreadQuery,
    markReadMutation,
    markAllReadMutation,
    deleteMutation,
    deleteAllReadMutation,
  } = useNotifications(userId);

  const notifications = useMemo(
    () => notificationsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [notificationsQuery.data],
  );
  const groups = useMemo(
    () =>
      groupOrder
        .map((label) => ({
          label,
          notifications: notifications.filter(
            (notification) =>
              getNotificationGroup(notification.createdAt) === label,
          ),
        }))
        .filter((group) => group.notifications.length > 0),
    [notifications],
  );
  const unreadCount = unreadQuery.data ?? 0;
  const hasRead = notifications.some((notification) => notification.read);

  const handleAction = (notification: AppNotification) => {
    if (!notification.read) markReadMutation.mutate(notification.id);
    const page = notificationActionPage(notification.actionUrl);
    if (page) {
      onNavigate(page);
      setOpen(false);
    }
  };

  const reportError = () =>
    toast.error("That notification action could not be completed.");

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <button
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-5 pr-12 text-left">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                  : "You're all caught up"}
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                className="h-8 px-2 text-xs"
                disabled={markAllReadMutation.isPending}
                onClick={() =>
                  markAllReadMutation.mutate(undefined, { onError: reportError })
                }
                size="sm"
                variant="ghost"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-5 p-4">
            {notificationsQuery.isPending && (
              <div aria-label="Loading notifications" className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <Skeleton className="h-28 rounded-xl" key={item} />
                ))}
              </div>
            )}

            {notificationsQuery.isError && (
              <div className="rounded-xl border border-destructive/30 p-5 text-center">
                <AlertCircle className="mx-auto h-6 w-6 text-destructive" />
                <p className="mt-2 text-sm font-semibold">
                  Notifications could not be loaded.
                </p>
                <Button
                  className="mt-3"
                  onClick={() => void notificationsQuery.refetch()}
                  size="sm"
                  variant="outline"
                >
                  Try again
                </Button>
              </div>
            )}

            {!notificationsQuery.isPending &&
              !notificationsQuery.isError &&
              notifications.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold">No notifications yet</h3>
                  <p className="mx-auto mt-1 max-w-64 text-xs leading-relaxed text-muted-foreground">
                    Workout updates, new records, achievements, and account
                    activity will appear here.
                  </p>
                </div>
              )}

            {groups.map((group) => (
              <section aria-labelledby={`notification-group-${group.label}`} key={group.label}>
                <h3
                  className="mb-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-muted-foreground"
                  id={`notification-group-${group.label}`}
                >
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDelete={() =>
                        deleteMutation.mutate(notification.id, {
                          onError: reportError,
                        })
                      }
                      onOpen={() => handleAction(notification)}
                      onRead={() =>
                        markReadMutation.mutate(notification.id, {
                          onError: reportError,
                        })
                      }
                    />
                  ))}
                </div>
              </section>
            ))}

            {notificationsQuery.hasNextPage && (
              <Button
                className="w-full"
                disabled={notificationsQuery.isFetchingNextPage}
                onClick={() => void notificationsQuery.fetchNextPage()}
                size="sm"
                variant="outline"
              >
                {notificationsQuery.isFetchingNextPage
                  ? "Loading…"
                  : "Load older notifications"}
              </Button>
            )}
          </div>
        </ScrollArea>

        {hasRead && (
          <div className="border-t border-border p-3">
            <Button
              className="w-full text-xs text-muted-foreground hover:text-destructive"
              disabled={deleteAllReadMutation.isPending}
              onClick={() =>
                deleteAllReadMutation.mutate(undefined, { onError: reportError })
              }
              size="sm"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
              Delete all read notifications
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
