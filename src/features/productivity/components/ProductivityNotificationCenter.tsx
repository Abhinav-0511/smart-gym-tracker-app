import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CalendarDays,
  CheckCheck,
  Clock,
  type LucideIcon,
  Sunrise,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProductivityNotifications } from "@/features/productivity/hooks/useProductivityNotifications";
import type { ProductivityNotification } from "@/features/productivity/types/notification";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "alert-triangle": AlertTriangle,
  clock: Clock,
  bell: Bell,
  sunrise: Sunrise,
  calendar: Calendar,
  "calendar-days": CalendarDays,
};

const ACTION_TO_PAGE: Record<string, string> = {
  "/productivity": "home",
  "/productivity/habits": "habits",
  "/productivity/tasks": "tasks",
  "/productivity/calendar": "calendar",
};

interface ProductivityNotificationCenterProps {
  userId: string | undefined;
  timezone: string;
  onNavigate: (page: string) => void;
}

const ProductivityNotificationCenter = ({
  userId,
  timezone,
  onNavigate,
}: ProductivityNotificationCenterProps) => {
  const { notificationsQuery, unreadCount, markRead, markAllRead, deleteNotification } =
    useProductivityNotifications(userId, timezone);

  const notifications = notificationsQuery.data ?? [];

  const handleOpen = (notification: ProductivityNotification) => {
    if (!notification.read) markRead(notification.id);
    if (notification.actionUrl) {
      const page = ACTION_TO_PAGE[notification.actionUrl];
      if (page) onNavigate(page);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <p className="text-sm font-bold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">You’re all caught up.</p>
            </div>
          ) : (
            <ul>
              {notifications.map((notification) => {
                const Icon = ICONS[notification.icon] ?? Bell;
                return (
                  <li
                    key={notification.id}
                    className={cn(
                      "group flex items-start gap-3 border-b border-border/40 px-4 py-3 last:border-0",
                      !notification.read && "bg-primary/5",
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                      <Icon size={15} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpen(notification)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </button>
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      <button
                        type="button"
                        aria-label="Dismiss notification"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-border/60 px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => notifications.forEach((item) => deleteNotification(item.id))}
            >
              <Trash2 size={13} /> Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ProductivityNotificationCenter;
