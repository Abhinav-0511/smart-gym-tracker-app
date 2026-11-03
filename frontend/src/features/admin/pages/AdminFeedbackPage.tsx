import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AdminEmptyState, AdminError, AdminLoading } from "@/features/admin/components/AdminStates";
import { listFeedback } from "@/features/admin/services/admin";
import {
  FEEDBACK_TYPE_OPTIONS,
  feedbackTypeLabel,
  type FeedbackModule,
  type FeedbackType,
} from "@/features/help/services/feedback";

const MODULE_LABELS: Record<string, string> = {
  fitness: "Fitness",
  productivity: "Productivity",
  finance: "Finance",
  general: "General",
};

const DATE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

/** Resolve a date preset to an inclusive ISO lower bound, or undefined for "all". */
function sinceFromPreset(preset: string): string | undefined {
  const now = new Date();
  switch (preset) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start.toISOString();
    }
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return undefined;
  }
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const Stars = ({ rating }: { rating: number }) => (
  <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((value) => (
      <Star
        key={value}
        size={14}
        className={cn(
          value <= rating ? "fill-primary text-primary" : "text-muted-foreground/40",
        )}
      />
    ))}
  </span>
);

/** Feedback reader with rating, type, module and date filters, newest first. */
const AdminFeedbackPage = () => {
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin", "feedback", ratingFilter, typeFilter, moduleFilter, dateFilter],
    queryFn: () =>
      listFeedback({
        rating: ratingFilter === "all" ? undefined : Number(ratingFilter),
        feedbackType: typeFilter === "all" ? undefined : (typeFilter as FeedbackType),
        module: moduleFilter === "all" ? undefined : (moduleFilter as FeedbackModule),
        since: sinceFromPreset(dateFilter),
      }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger aria-label="Filter by rating">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value} star{value === 1 ? "" : "s"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger aria-label="Filter by feedback type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {FEEDBACK_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger aria-label="Filter by module">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {Object.entries(MODULE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger aria-label="Filter by date">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              {DATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending ? (
        <AdminLoading label="Loading feedback" />
      ) : error ? (
        <AdminError
          message={error instanceof Error ? error.message : "Please try again."}
          onRetry={() => void refetch()}
        />
      ) : data.length === 0 ? (
        <AdminEmptyState
          icon={Star}
          title="No feedback yet"
          description="Feedback submitted from the Help Center will appear here."
        />
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <GlassCard key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={item.rating} />
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      {feedbackTypeLabel(item.feedback_type)}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {MODULE_LABELS[item.module] ?? item.module}
                    </span>
                  </div>
                  {item.comment ? (
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                      {item.comment}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-sm italic text-muted-foreground">No comment</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{item.email}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatWhen(item.created_at)}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {data?.length ?? 0} response{(data?.length ?? 0) === 1 ? "" : "s"}
      </p>
    </div>
  );
};

export default AdminFeedbackPage;
