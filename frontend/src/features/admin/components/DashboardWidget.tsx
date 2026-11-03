import type { ReactNode } from "react";
import { ArrowRight, LoaderCircle, type LucideIcon } from "lucide-react";

import GlassCard from "@/components/GlassCard";

interface DashboardWidgetProps {
  title: string;
  icon: LucideIcon;
  /** "View all" affordance shown in the header. */
  viewAllLabel?: string;
  onViewAll?: () => void;
  isPending: boolean;
  error: unknown;
  onRetry: () => void;
  isEmpty: boolean;
  emptyTitle: string;
  children: ReactNode;
}

/**
 * Shared frame for a dashboard list widget: a titled GlassCard with an optional
 * "View all" link, and one place that resolves the loading / error / empty /
 * content states. Centralising it here keeps the four dashboard widgets free of
 * duplicated state-handling code and consistent in look and behaviour.
 */
const DashboardWidget = ({
  title,
  icon: Icon,
  viewAllLabel,
  onViewAll,
  isPending,
  error,
  onRetry,
  isEmpty,
  emptyTitle,
  children,
}: DashboardWidgetProps) => (
  <GlassCard className="flex flex-col">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Icon size={16} className="text-primary" />
        {title}
      </h2>
      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {viewAllLabel ?? "View all"}
          <ArrowRight size={13} />
        </button>
      )}
    </div>

    {isPending ? (
      <div
        className="flex items-center justify-center gap-2 py-8 text-muted-foreground"
        role="status"
        aria-label="Loading"
      >
        <LoaderCircle size={16} className="animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    ) : error ? (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Couldn’t load this section."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs font-semibold text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    ) : isEmpty ? (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyTitle}</p>
      </div>
    ) : (
      <div className="space-y-1">{children}</div>
    )}
  </GlassCard>
);

export default DashboardWidget;
