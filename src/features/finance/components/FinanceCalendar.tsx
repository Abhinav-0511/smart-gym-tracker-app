import { WEEKDAY_HEADERS, type CalendarDay } from "@/features/finance/lib/calendar";
import { formatCompactCurrency } from "@/features/finance/lib/money";
import { cn } from "@/lib/utils";

interface FinanceCalendarProps {
  cells: CalendarDay[];
  currency: string;
  onSelectDay: (dateKey: string) => void;
}

const FinanceCalendar = ({ cells, currency, onSelectDay }: FinanceCalendarProps) => (
  <div>
    <div className="mb-1 grid grid-cols-7 gap-1">
      {WEEKDAY_HEADERS.map((day) => (
        <div key={day} className="py-1 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {day}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-7 gap-1">
      {cells.map((cell) => {
        const hasActivity = cell.transactionCount > 0;
        return (
          <button
            key={cell.dateKey}
            type="button"
            disabled={!hasActivity}
            onClick={() => onSelectDay(cell.dateKey)}
            className={cn(
              "flex min-h-[3.75rem] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[5rem]",
              cell.inCurrentMonth
                ? "border-border/60 bg-secondary/30"
                : "border-transparent bg-transparent opacity-40",
              hasActivity && "hover:border-primary/40 hover:bg-secondary/60",
              !hasActivity && "cursor-default",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                cell.isToday
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              {cell.dayOfMonth}
            </span>
            {hasActivity && (
              <span className="mt-auto space-y-0.5 text-[10px] font-semibold leading-tight">
                {cell.income > 0 && (
                  <span className="block truncate text-emerald-500">
                    +{formatCompactCurrency(cell.income, currency)}
                  </span>
                )}
                {cell.expense > 0 && (
                  <span className="block truncate text-rose-500">
                    -{formatCompactCurrency(cell.expense, currency)}
                  </span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default FinanceCalendar;
