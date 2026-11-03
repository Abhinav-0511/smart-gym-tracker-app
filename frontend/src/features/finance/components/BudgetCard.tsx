import { MoreVertical, Pencil, Trash2, TriangleAlert } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CategoryChip from "@/features/finance/components/CategoryChip";
import { getFinanceColorClasses } from "@/features/finance/lib/finance-colors";
import { BUDGET_PERIOD_LABELS } from "@/features/finance/types/budget";
import { formatCurrency } from "@/features/finance/lib/money";
import type { Budget, BudgetProgress } from "@/features/finance/types/budget";
import type { TransactionCategory } from "@/features/finance/types/category";
import { cn } from "@/lib/utils";

interface BudgetCardProps {
  progress: BudgetProgress;
  category: TransactionCategory | undefined;
  currency: string;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

const BudgetCard = ({ progress, category, currency, onEdit, onDelete }: BudgetCardProps) => {
  const { budget, spent, remaining, percent, isOver } = progress;
  const barColor = isOver ? "bg-rose-500" : getFinanceColorClasses(budget.color).solid;

  return (
    <GlassCard className="space-y-3">
      <div className="flex items-start gap-3">
        <CategoryChip category={category} size={42} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{budget.name}</p>
          <p className="text-xs text-muted-foreground">
            {BUDGET_PERIOD_LABELS[budget.period]}
            {budget.categoryId === null ? " · All categories" : ""}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Budget actions"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <MoreVertical size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(budget)} className="cursor-pointer gap-2">
              <Pencil size={15} /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onDelete(budget)}
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 size={15} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-extrabold text-foreground">
            {formatCurrency(spent, currency)}
          </span>
          <span className="text-xs text-muted-foreground">
            of {formatCurrency(budget.amount, currency)}
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${Math.max(percent, spent > 0 ? 4 : 0)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold">
          {isOver ? (
            <span className="flex items-center gap-1 text-rose-500">
              <TriangleAlert size={13} /> Over by {formatCurrency(Math.abs(remaining), currency)}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {formatCurrency(remaining, currency)} left
            </span>
          )}
          <span className={cn(isOver ? "text-rose-500" : "text-foreground")}>{percent}%</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default BudgetCard;
