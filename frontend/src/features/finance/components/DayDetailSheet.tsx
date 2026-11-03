import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import TransactionItem from "@/features/finance/components/TransactionItem";
import { formatDayLabel } from "@/features/finance/lib/dates";
import { formatCurrency } from "@/features/finance/lib/money";
import type { TransactionCategory } from "@/features/finance/types/category";
import type { Transaction } from "@/features/finance/types/transaction";

interface DayDetailSheetProps {
  open: boolean;
  dateKey: string | null;
  transactions: Transaction[];
  categoriesById: Map<string, TransactionCategory>;
  currency: string;
  onOpenChange: (open: boolean) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onAdd: (dateKey: string) => void;
}

const DayDetailSheet = ({
  open,
  dateKey,
  transactions,
  categoriesById,
  currency,
  onOpenChange,
  onEdit,
  onDelete,
  onAdd,
}: DayDetailSheetProps) => {
  const income = transactions.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0);
  const expense = transactions.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0);
  const net = income - expense;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>{dateKey ? formatDayLabel(dateKey) : "Day"}</SheetTitle>
          <SheetDescription>
            {transactions.length} {transactions.length === 1 ? "transaction" : "transactions"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-secondary/50 p-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">In</p>
            <p className="text-sm font-bold text-emerald-500">{formatCurrency(income, currency)}</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Out</p>
            <p className="text-sm font-bold text-rose-500">{formatCurrency(expense, currency)}</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Net</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(net, currency)}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {transactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              category={tx.categoryId ? categoriesById.get(tx.categoryId) : undefined}
              currency={currency}
              showDate={false}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>

        {dateKey && (
          <Button variant="outline" className="mt-4 w-full" onClick={() => onAdd(dateKey)}>
            <Plus size={16} /> Add on this day
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DayDetailSheet;
