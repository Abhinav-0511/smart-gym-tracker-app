import { Check, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFinanceColorClasses } from "@/features/finance/lib/finance-colors";
import { getFinanceIcon } from "@/features/finance/lib/finance-icons";
import { formatCurrency } from "@/features/finance/lib/money";
import { computeSavingsProgress } from "@/features/finance/lib/savings-progress";
import { formatDayLabel } from "@/features/finance/lib/dates";
import type { SavingsGoal } from "@/features/finance/types/savings";
import { cn } from "@/lib/utils";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  currency: string;
  todayKey: string;
  onAddFunds: (goal: SavingsGoal) => void;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (goal: SavingsGoal) => void;
}

const SavingsGoalCard = ({
  goal,
  currency,
  todayKey,
  onAddFunds,
  onEdit,
  onDelete,
}: SavingsGoalCardProps) => {
  const progress = computeSavingsProgress(goal, todayKey);
  const classes = getFinanceColorClasses(goal.color);
  const Icon = getFinanceIcon(goal.icon);

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", classes.chip, classes.icon)}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{goal.name}</p>
          <p className="text-xs text-muted-foreground">
            {progress.isComplete
              ? "Goal reached 🎉"
              : goal.targetDate
                ? `Target · ${formatDayLabel(goal.targetDate)}`
                : "No target date"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Goal actions"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <MoreVertical size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(goal)} className="cursor-pointer gap-2">
              <Pencil size={15} /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onDelete(goal)}
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
            {formatCurrency(goal.currentAmount, currency)}
          </span>
          <span className="text-xs text-muted-foreground">
            of {formatCurrency(goal.targetAmount, currency)}
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full transition-all", classes.solid)}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground">
            {progress.isComplete
              ? "Complete"
              : `${formatCurrency(progress.remaining, currency)} to go`}
          </span>
          <span className="text-foreground">
            {progress.percent}%
            {progress.daysRemaining !== null && !progress.isComplete
              ? ` · ${progress.daysRemaining}d`
              : ""}
          </span>
        </div>
      </div>

      <Button
        variant={progress.isComplete ? "outline" : "default"}
        className="w-full"
        onClick={() => onAddFunds(goal)}
      >
        {progress.isComplete ? <Check size={16} /> : <Plus size={16} />}
        {progress.isComplete ? "Adjust funds" : "Add funds"}
      </Button>
    </GlassCard>
  );
};

export default SavingsGoalCard;
