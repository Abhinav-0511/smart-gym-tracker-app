import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseAmount } from "@/features/finance/lib/money";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/features/finance/types/common";
import {
  RECURRING_FREQUENCIES,
  RECURRING_FREQUENCY_LABELS,
  type CreateRecurringInput,
  type RecurringFrequency,
  type RecurringTransaction,
  type RecurringType,
} from "@/features/finance/types/recurring";
import type { FinanceAccount } from "@/features/finance/types/account";
import type { TransactionCategory } from "@/features/finance/types/category";
import { cn } from "@/lib/utils";

const NONE_VALUE = "__none__";

interface RecurringFormDialogProps {
  open: boolean;
  recurring: RecurringTransaction | null;
  categories: TransactionCategory[];
  accounts: FinanceAccount[];
  defaultDateKey: string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateRecurringInput) => Promise<void>;
}

const RecurringFormDialog = ({
  open,
  recurring,
  categories,
  accounts,
  defaultDateKey,
  saving,
  onOpenChange,
  onSubmit,
}: RecurringFormDialogProps) => {
  const [type, setType] = useState<RecurringType>("expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(NONE_VALUE);
  const [accountId, setAccountId] = useState(NONE_VALUE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [nextRunOn, setNextRunOn] = useState(defaultDateKey);
  const [endOn, setEndOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType(recurring?.type ?? "expense");
    setAmount(recurring ? String(recurring.amount) : "");
    setTitle(recurring?.title ?? "");
    setCategoryId(recurring?.categoryId ?? NONE_VALUE);
    setAccountId(recurring?.accountId ?? NONE_VALUE);
    setPaymentMethod(recurring?.paymentMethod ?? "bank_transfer");
    setFrequency(recurring?.frequency ?? "monthly");
    setNextRunOn(recurring?.nextRunOn ?? defaultDateKey);
    setEndOn(recurring?.endOn ?? "");
    setError(null);
  }, [open, recurring, defaultDateKey]);

  const availableCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );

  useEffect(() => {
    if (categoryId !== NONE_VALUE && !availableCategories.some((c) => c.id === categoryId)) {
      setCategoryId(NONE_VALUE);
    }
  }, [availableCategories, categoryId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = parseAmount(amount);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Give this recurring entry a title.");
      return;
    }
    if (parsedAmount === null) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (endOn && endOn < nextRunOn) {
      setError("End date can’t be before the next run date.");
      return;
    }
    try {
      await onSubmit({
        type,
        amount: parsedAmount,
        title: trimmedTitle,
        categoryId: categoryId === NONE_VALUE ? null : categoryId,
        accountId: accountId === NONE_VALUE ? null : accountId,
        paymentMethod,
        frequency,
        nextRunOn,
        startOn: recurring?.startOn ?? nextRunOn,
        endOn: endOn || null,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn’t save recurring entry.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{recurring ? "Edit Recurring" : "New Recurring"}</DialogTitle>
          <DialogDescription>Automate salary, rent, subscriptions, and more.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                disabled={saving}
                aria-pressed={type === option}
                className={cn(
                  "rounded-xl py-2 text-sm font-semibold capitalize transition",
                  type === option
                    ? option === "income"
                      ? "bg-emerald-500 text-white"
                      : "bg-rose-500 text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rec-amount">Amount</Label>
              <Input
                id="rec-amount"
                inputMode="decimal"
                value={amount}
                placeholder="0.00"
                onChange={(event) => setAmount(event.target.value)}
                disabled={saving}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(value) => setFrequency(value as RecurringFrequency)} disabled={saving}>
                <SelectTrigger aria-label="Frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_FREQUENCIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {RECURRING_FREQUENCY_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rec-title">Title</Label>
            <Input
              id="rec-title"
              value={title}
              maxLength={120}
              placeholder="e.g. Rent"
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={saving}>
                <SelectTrigger aria-label="Category">
                  <SelectValue placeholder="Uncategorized" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Uncategorized</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId} disabled={saving}>
                <SelectTrigger aria-label="Account">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rec-next">Next run</Label>
              <Input
                id="rec-next"
                type="date"
                value={nextRunOn}
                onChange={(event) => setNextRunOn(event.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-end">End date (optional)</Label>
              <Input
                id="rec-end"
                type="date"
                value={endOn}
                onChange={(event) => setEndOn(event.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              disabled={saving}
            >
              <SelectTrigger aria-label="Payment method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              {recurring ? "Save changes" : "Create recurring"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringFormDialog;
