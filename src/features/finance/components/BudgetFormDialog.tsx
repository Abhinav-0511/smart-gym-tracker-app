import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFinanceColorClasses } from "@/features/finance/lib/finance-colors";
import { parseAmount } from "@/features/finance/lib/money";
import {
  BUDGET_PERIODS,
  BUDGET_PERIOD_LABELS,
  type Budget,
  type BudgetPeriod,
  type CreateBudgetInput,
} from "@/features/finance/types/budget";
import { FINANCE_COLORS, type FinanceColor } from "@/features/finance/types/common";
import type { TransactionCategory } from "@/features/finance/types/category";
import { cn } from "@/lib/utils";

const OVERALL_VALUE = "__overall__";

interface BudgetFormDialogProps {
  open: boolean;
  budget: Budget | null;
  expenseCategories: TransactionCategory[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateBudgetInput) => Promise<void>;
}

const BudgetFormDialog = ({
  open,
  budget,
  expenseCategories,
  saving,
  onOpenChange,
  onSubmit,
}: BudgetFormDialogProps) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("monthly");
  const [categoryValue, setCategoryValue] = useState<string>(OVERALL_VALUE);
  const [color, setColor] = useState<FinanceColor>("blue");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(budget?.name ?? "");
    setAmount(budget ? String(budget.amount) : "");
    setPeriod(budget?.period ?? "monthly");
    setCategoryValue(budget?.categoryId ?? OVERALL_VALUE);
    setColor(budget?.color ?? "blue");
    setError(null);
  }, [open, budget]);

  const handleCategoryChange = (value: string) => {
    setCategoryValue(value);
    if (!name.trim()) {
      if (value === OVERALL_VALUE) setName("Overall");
      else setName(expenseCategories.find((c) => c.id === value)?.name ?? "");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = parseAmount(amount);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give this budget a name.");
      return;
    }
    if (parsedAmount === null) {
      setError("Enter a budget amount greater than zero.");
      return;
    }
    try {
      await onSubmit({
        name: trimmedName,
        amount: parsedAmount,
        period,
        categoryId: categoryValue === OVERALL_VALUE ? null : categoryValue,
        color,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn’t save budget.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{budget ? "Edit Budget" : "New Budget"}</DialogTitle>
          <DialogDescription>Set a spending cap and track it in real time.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryValue} onValueChange={handleCategoryChange} disabled={saving}>
              <SelectTrigger aria-label="Budget category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OVERALL_VALUE}>Overall (all categories)</SelectItem>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-name">Name</Label>
            <Input
              id="budget-name"
              value={name}
              maxLength={60}
              enterKeyHint="next"
              autoCapitalize="sentences"
              placeholder="e.g. Food this month"
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="budget-amount">Amount</Label>
              <NumericInput
                id="budget-amount"
                value={amount}
                placeholder="0.00"
                enterKeyHint="done"
                onValueChange={setAmount}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={period} onValueChange={(value) => setPeriod(value as BudgetPeriod)} disabled={saving}>
                <SelectTrigger aria-label="Period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_PERIODS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {BUDGET_PERIOD_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Colour</Label>
            <div className="flex flex-wrap gap-2">
              {FINANCE_COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={item}
                  aria-pressed={color === item}
                  onClick={() => setColor(item)}
                  disabled={saving}
                  className={cn(
                    "h-7 w-7 rounded-full transition",
                    getFinanceColorClasses(item).solid,
                    color === item
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      : "opacity-80 hover:opacity-100",
                  )}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              {budget ? "Save changes" : "Create budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetFormDialog;
