import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/features/admin/services/admin";

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  in_progress: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  closed: "bg-secondary text-muted-foreground",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

/** Colored pill for a support-ticket status. */
const TicketStatusBadge = ({ status }: { status: string }) => {
  const key = (status as TicketStatus) in STATUS_STYLES ? (status as TicketStatus) : "closed";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[key],
      )}
    >
      {STATUS_LABELS[key]}
    </span>
  );
};

export default TicketStatusBadge;
