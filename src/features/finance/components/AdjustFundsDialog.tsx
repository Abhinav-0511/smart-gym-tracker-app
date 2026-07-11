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
import { Label } from "@/components/ui/label";
import { formatCurrency, parseAmount } from "@/features/finance/lib/money";
import type { SavingsGoal } from "@/features/finance/types/savings";
import { cn } from "@/lib/utils";

interface AdjustFundsDialogProps {
  open: boolean;
  goal: SavingsGoal | null;
  currency: string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (delta: number) => Promise<void>;
}

const AdjustFundsDialog = ({
  open,
  goal,
  currency,
  saving,
  onOpenChange,
  onSubmit,
}: AdjustFundsDialogProps) => {
  const [mode, setMode] = useState<"add" | "withdraw">("add");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode("add");
    setAmount("");
    setError(null);
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseAmount(amount);
    if (parsed === null) {
      setError("Enter an amount greater than zero.");
      return;
    }
    try {
      await onSubmit(mode === "add" ? parsed : -parsed);
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn’t update funds.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{goal?.name ?? "Adjust funds"}</DialogTitle>
          <DialogDescription>
            {goal
              ? `Currently saved: ${formatCurrency(goal.currentAmount, currency)}`
              : "Update the amount saved."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["add", "withdraw"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                disabled={saving}
                aria-pressed={mode === option}
                className={cn(
                  "rounded-xl py-2 text-sm font-semibold capitalize transition",
                  mode === option
                    ? option === "add"
                      ? "bg-emerald-500 text-white"
                      : "bg-rose-500 text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="funds-amount">Amount</Label>
            <Input
              id="funds-amount"
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              onChange={(event) => setAmount(event.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              {mode === "add" ? "Add funds" : "Withdraw"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustFundsDialog;
