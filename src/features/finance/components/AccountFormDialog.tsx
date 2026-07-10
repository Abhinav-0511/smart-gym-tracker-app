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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFinanceColorClasses } from "@/features/finance/lib/finance-colors";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  type AccountType,
  type CreateAccountInput,
  type FinanceAccount,
} from "@/features/finance/types/account";
import { DEFAULT_CURRENCY, FINANCE_COLORS, type FinanceColor } from "@/features/finance/types/common";
import { cn } from "@/lib/utils";

const ACCOUNT_ICONS: Record<AccountType, string> = {
  cash: "banknote",
  bank: "landmark",
  credit_card: "credit-card",
  wallet: "wallet",
  other: "circle-dollar-sign",
};

interface AccountFormDialogProps {
  open: boolean;
  account: FinanceAccount | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateAccountInput) => Promise<void>;
}

const AccountFormDialog = ({
  open,
  account,
  saving,
  onOpenChange,
  onSubmit,
}: AccountFormDialogProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [initialBalance, setInitialBalance] = useState("");
  const [color, setColor] = useState<FinanceColor>("blue");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? "");
    setType(account?.type ?? "bank");
    setCurrency(account?.currency ?? DEFAULT_CURRENCY);
    setInitialBalance(account ? String(account.initialBalance) : "");
    setColor(account?.color ?? "blue");
    setError(null);
  }, [open, account]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give this account a name.");
      return;
    }
    const balance = initialBalance.trim() ? Number(initialBalance) : 0;
    if (!Number.isFinite(balance)) {
      setError("Opening balance must be a number.");
      return;
    }
    const code = currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) {
      setError("Currency must be a 3-letter code, e.g. INR.");
      return;
    }
    try {
      await onSubmit({
        name: trimmedName,
        type,
        currency: code,
        initialBalance: Math.round(balance * 100) / 100,
        icon: ACCOUNT_ICONS[type],
        color,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn’t save account.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "New Account"}</DialogTitle>
          <DialogDescription>Track cash, bank accounts, cards, and wallets.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Name</Label>
            <Input
              id="account-name"
              value={name}
              maxLength={60}
              placeholder="e.g. HDFC Savings"
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as AccountType)} disabled={saving}>
                <SelectTrigger aria-label="Account type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {ACCOUNT_TYPE_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-currency">Currency</Label>
              <Input
                id="account-currency"
                value={currency}
                maxLength={3}
                placeholder="INR"
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-balance">Opening balance</Label>
            <Input
              id="account-balance"
              inputMode="decimal"
              value={initialBalance}
              placeholder="0.00"
              onChange={(event) => setInitialBalance(event.target.value)}
              disabled={saving}
            />
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
              {account ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountFormDialog;
