import { ChevronLeft, ChevronRight } from "lucide-react";

import { addMonths, monthLabel } from "@/features/finance/lib/dates";
import { cn } from "@/lib/utils";

interface MonthNavProps {
  monthKey: string;
  onChange: (monthKey: string) => void;
  /** Latest selectable month; the next button is disabled at/after it. */
  maxMonthKey?: string;
  className?: string;
}

const MonthNav = ({ monthKey, onChange, maxMonthKey, className }: MonthNavProps) => {
  const atMax = maxMonthKey ? monthKey >= maxMonthKey : false;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onChange(addMonths(monthKey, -1))}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="min-w-[8.5rem] text-center text-sm font-bold text-foreground">
        {monthLabel(monthKey)}
      </span>
      <button
        type="button"
        aria-label="Next month"
        disabled={atMax}
        onClick={() => onChange(addMonths(monthKey, 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default MonthNav;
