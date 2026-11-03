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
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseAmount } from "@/features/finance/lib/money";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
  type TransactionType,
} from "@/features/finance/types/common";
import type { FinanceAccount } from "@/features/finance/types/account";
import type { TransactionCategory } from "@/features/finance/types/category";
import type {
  CreateTransactionInput,
  Transaction,
} from "@/features/finance/types/transaction";
import { cn } from "@/lib/utils";

const NONE_VALUE = "__none__";

const TYPE_OPTIONS: { value: TransactionType; label: string; active: string }[] = [
  { value: "expense", label: "Expense", active: "bg-rose-500 text-white" },
  { value: "income", label: "Income", active: "bg-emerald-500 text-white" },
  { value: "transfer", label: "Transfer", active: "bg-blue-500 text-white" },
];

interface TransactionFormDialogProps {
  open: boolean;
  transaction: Transaction | null;
  categories: TransactionCategory[];
  accounts: FinanceAccount[];
  defaultDateKey: string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateTransactionInput) => Promise<void>;
}

const TransactionFormDialog = ({
  open,
  transaction,
  categories,
  accounts,
  defaultDateKey,
  saving,
  onOpenChange,
  onSubmit,
}: TransactionFormDialogProps) => {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>(NONE_VALUE);
  const [accountId, setAccountId] = useState<string>(NONE_VALUE);
  const [transferAccountId, setTransferAccountId] = useState<string>(NONE_VALUE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [occurredOn, setOccurredOn] = useState(defaultDateKey);
  const [occurredAt, setOccurredAt] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType(transaction?.type ?? "expense");
    setAmount(transaction ? String(transaction.amount) : "");
    setTitle(transaction?.title ?? "");
    setCategoryId(transaction?.categoryId ?? NONE_VALUE);
    setAccountId(transaction?.accountId ?? NONE_VALUE);
    setTransferAccountId(transaction?.transferAccountId ?? NONE_VALUE);
    setPaymentMethod(transaction?.paymentMethod ?? "cash");
    setOccurredOn(transaction?.occurredOn ?? defaultDateKey);
    setOccurredAt(transaction?.occurredAt?.slice(0, 5) ?? "");
    setNotes(transaction?.notes ?? "");
    setTags(transaction?.tags.join(", ") ?? "");
    setError(null);
  }, [open, transaction, defaultDateKey]);

  const availableCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );

  // Keep the selected category valid when the type flips.
  useEffect(() => {
    if (type === "transfer") return;
    if (categoryId !== NONE_VALUE && !availableCategories.some((c) => c.id === categoryId)) {
      setCategoryId(NONE_VALUE);
    }
  }, [type, availableCategories, categoryId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = parseAmount(amount);
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Give this transaction a title.");
      return;
    }
    if (parsedAmount === null) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (type === "transfer") {
      if (accountId === NONE_VALUE || transferAccountId === NONE_VALUE) {
        setError("Choose both the source and destination accounts.");
        return;
      }
      if (accountId === transferAccountId) {
        setError("Transfer accounts must be different.");
        return;
      }
    }

    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 20);

    try {
      await onSubmit({
        type,
        amount: parsedAmount,
        title: trimmedTitle,
        categoryId: type === "transfer" ? null : categoryId === NONE_VALUE ? null : categoryId,
        accountId: accountId === NONE_VALUE ? null : accountId,
        transferAccountId:
          type === "transfer" && transferAccountId !== NONE_VALUE ? transferAccountId : null,
        paymentMethod,
        occurredOn,
        occurredAt: occurredAt || null,
        notes: notes.trim() || null,
        tags: parsedTags,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn’t save transaction.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit Transaction" : "New Transaction"}</DialogTitle>
          <DialogDescription>Record money coming in, going out, or moving between accounts.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                disabled={saving}
                aria-pressed={type === option.value}
                className={cn(
                  "rounded-xl py-2 text-sm font-semibold transition",
                  type === option.value
                    ? option.active
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Amount</Label>
              <NumericInput
                id="tx-amount"
                value={amount}
                placeholder="0.00"
                enterKeyHint="next"
                onValueChange={setAmount}
                disabled={saving}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                value={occurredOn}
                onChange={(event) => setOccurredOn(event.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-title">Title</Label>
            <Input
              id="tx-title"
              value={title}
              maxLength={120}
              enterKeyHint="next"
              autoCapitalize="sentences"
              placeholder={type === "income" ? "e.g. July salary" : "e.g. Groceries"}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
            />
          </div>

          {type !== "transfer" && (
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
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{type === "transfer" ? "From account" : "Account"}</Label>
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
            {type === "transfer" ? (
              <div className="space-y-2">
                <Label>To account</Label>
                <Select value={transferAccountId} onValueChange={setTransferAccountId} disabled={saving}>
                  <SelectTrigger aria-label="Destination account">
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
            ) : (
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
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tx-time">Time (optional)</Label>
              <Input
                id="tx-time"
                type="time"
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-tags">Tags</Label>
              <Input
                id="tx-tags"
                value={tags}
                placeholder="comma, separated"
                enterKeyHint="done"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onChange={(event) => setTags(event.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-notes">Notes</Label>
            <Textarea
              id="tx-notes"
              value={notes}
              maxLength={2000}
              rows={2}
              placeholder="Optional notes"
              onChange={(event) => setNotes(event.target.value)}
              disabled={saving}
            />
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              {transaction ? "Save changes" : "Add transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionFormDialog;
