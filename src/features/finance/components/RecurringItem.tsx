import { CalendarClock, MoreVertical, Pencil, Play, Power, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CategoryChip from "@/features/finance/components/CategoryChip";
import { formatDayLabel } from "@/features/finance/lib/dates";
import { formatSignedCurrency } from "@/features/finance/lib/money";
import { RECURRING_FREQUENCY_LABELS } from "@/features/finance/types/recurring";
import type { RecurringTransaction } from "@/features/finance/types/recurring";
import type { TransactionCategory } from "@/features/finance/types/category";
import { cn } from "@/lib/utils";

interface RecurringItemProps {
  recurring: RecurringTransaction;
  category: TransactionCategory | undefined;
  currency: string;
  posting: boolean;
  onPost: (recurring: RecurringTransaction) => void;
  onToggleActive: (recurring: RecurringTransaction) => void;
  onEdit: (recurring: RecurringTransaction) => void;
  onDelete: (recurring: RecurringTransaction) => void;
}

const RecurringItem = ({
  recurring,
  category,
  currency,
  posting,
  onPost,
  onToggleActive,
  onEdit,
  onDelete,
}: RecurringItemProps) => {
  const direction = recurring.type === "income" ? "in" : "out";
  const amountTone = recurring.type === "income" ? "text-emerald-500" : "text-rose-500";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/40 p-3",
        !recurring.isActive && "opacity-60",
      )}
    >
      <CategoryChip category={category} size={42} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{recurring.title}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <CalendarClock size={12} />
          {RECURRING_FREQUENCY_LABELS[recurring.frequency]} · next {formatDayLabel(recurring.nextRunOn)}
        </p>
      </div>
      <span className={cn("text-sm font-bold tabular-nums", amountTone)}>
        {formatSignedCurrency(recurring.amount, direction, currency)}
      </span>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          disabled={posting || !recurring.isActive}
          onClick={() => onPost(recurring)}
        >
          <Play size={14} /> Post
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Recurring actions"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <MoreVertical size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(recurring)} className="cursor-pointer gap-2">
              <Pencil size={15} /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleActive(recurring)} className="cursor-pointer gap-2">
              <Power size={15} /> {recurring.isActive ? "Pause" : "Resume"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onDelete(recurring)}
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 size={15} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default RecurringItem;
