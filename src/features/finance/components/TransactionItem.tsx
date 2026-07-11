import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CategoryChip from "@/features/finance/components/CategoryChip";
import { formatDayLabel } from "@/features/finance/lib/dates";
import { formatSignedCurrency } from "@/features/finance/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/features/finance/types/common";
import type { TransactionCategory } from "@/features/finance/types/category";
import type { Transaction } from "@/features/finance/types/transaction";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  transaction: Transaction;
  category: TransactionCategory | undefined;
  currency: string;
  /** When true, show the full date; otherwise only the time (day is implied). */
  showDate?: boolean;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

const TransactionItem = ({
  transaction,
  category,
  currency,
  showDate = true,
  onEdit,
  onDelete,
}: TransactionItemProps) => {
  const direction =
    transaction.type === "income" ? "in" : transaction.type === "expense" ? "out" : "neutral";
  const amountTone =
    transaction.type === "income"
      ? "text-emerald-500"
      : transaction.type === "expense"
        ? "text-rose-500"
        : "text-muted-foreground";

  const metaParts = [
    category?.name ?? "Uncategorized",
    PAYMENT_METHOD_LABELS[transaction.paymentMethod],
    showDate ? formatDayLabel(transaction.occurredOn) : transaction.occurredAt?.slice(0, 5),
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3 transition hover:bg-secondary/70">
      <CategoryChip category={category} size={42} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{transaction.title}</p>
        <p className="truncate text-xs text-muted-foreground">{metaParts.join(" · ")}</p>
        {transaction.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {transaction.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className={cn("text-sm font-bold tabular-nums", amountTone)}>
          {formatSignedCurrency(transaction.amount, direction, currency)}
        </span>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Transaction actions"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <MoreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onSelect={() => onEdit(transaction)} className="cursor-pointer gap-2">
                  <Pencil size={15} /> Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onSelect={() => onDelete(transaction)}
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 size={15} /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default TransactionItem;
