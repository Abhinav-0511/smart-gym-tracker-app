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
import { getFinanceColorClasses } from "@/features/finance/lib/finance-colors";
import { FINANCE_ICON_NAMES, getFinanceIcon } from "@/features/finance/lib/finance-icons";
import { parseAmount } from "@/features/finance/lib/money";
import { FINANCE_COLORS, type FinanceColor } from "@/features/finance/types/common";
import type {
  CreateSavingsGoalInput,
  SavingsGoal,
} from "@/features/finance/types/savings";
import { cn } from "@/lib/utils";

interface SavingsGoalFormDialogProps {
  open: boolean;
  goal: SavingsGoal | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateSavingsGoalInput) => Promise<void>;
}

const SavingsGoalFormDialog = ({
  open,
  goal,
  saving,
  onOpenChange,
  onSubmit,
}: SavingsGoalFormDialogProps) => {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [icon, setIcon] = useState("piggy-bank");
  const [color, setColor] = useState<FinanceColor>("emerald");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? "");
    setTargetAmount(goal ? String(goal.targetAmount) : "");
    setCurrentAmount(goal ? String(goal.currentAmount) : "");
    setTargetDate(goal?.targetDate ?? "");
    setIcon(goal?.icon ?? "piggy-bank");
    setColor(goal?.color ?? "emerald");
    setError(null);
  }, [open, goal]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedTarget = parseAmount(targetAmount);
    const parsedCurrent = currentAmount.trim() ? parseAmount(currentAmount) : 0;

    if (!trimmedName) {
      setError("Give your goal a name.");
      return;
    }
    if (parsedTarget === null) {
      setError("Enter a target amount greater than zero.");
      return;
    }
    if (parsedCurrent === null) {
      setError("Saved amount must be zero or a positive number.");
      return;
    }

    try {
      await onSubmit({
        name: trimmedName,
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        targetDate: targetDate || null,
        icon,
        color,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn’t save goal.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit Goal" : "New Savings Goal"}</DialogTitle>
          <DialogDescription>Save towards something that matters.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Name</Label>
            <Input
              id="goal-name"
              value={name}
              maxLength={80}
              enterKeyHint="next"
              autoCapitalize="sentences"
              placeholder="e.g. Emergency fund"
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="goal-target">Target amount</Label>
              <NumericInput
                id="goal-target"
                value={targetAmount}
                placeholder="0.00"
                enterKeyHint="next"
                onValueChange={setTargetAmount}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-current">Saved so far</Label>
              <NumericInput
                id="goal-current"
                value={currentAmount}
                placeholder="0.00"
                enterKeyHint="done"
                onValueChange={setCurrentAmount}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-date">Target date (optional)</Label>
            <Input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {FINANCE_ICON_NAMES.map((name) => {
                const IconComponent = getFinanceIcon(name);
                const active = icon === name;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-label={name}
                    aria-pressed={active}
                    onClick={() => setIcon(name)}
                    disabled={saving}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <IconComponent size={18} />
                  </button>
                );
              })}
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
              {goal ? "Save changes" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SavingsGoalFormDialog;
