import { useMemo, useState } from "react";
import { MoreVertical, Pencil, Plus, Trash2, Wallet } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AccountFormDialog from "@/features/finance/components/AccountFormDialog";
import BudgetCard from "@/features/finance/components/BudgetCard";
import BudgetFormDialog from "@/features/finance/components/BudgetFormDialog";
import StatCard from "@/features/finance/components/StatCard";
import { useBudgets } from "@/features/finance/hooks/useBudgets";
import { useFinanceAccounts } from "@/features/finance/hooks/useFinanceAccounts";
import { useFinanceData } from "@/features/finance/hooks/useFinanceData";
import { computeAllBudgetProgress } from "@/features/finance/lib/budget-progress";
import { getFinanceColorClasses } from "@/features/finance/lib/finance-colors";
import { getFinanceIcon } from "@/features/finance/lib/finance-icons";
import { formatCurrency } from "@/features/finance/lib/money";
import { ACCOUNT_TYPE_LABELS, type CreateAccountInput, type FinanceAccount } from "@/features/finance/types/account";
import type { Budget, CreateBudgetInput } from "@/features/finance/types/budget";
import { DEFAULT_CURRENCY } from "@/features/finance/types/common";
import { cn } from "@/lib/utils";

const BudgetsPage = () => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const currency = DEFAULT_CURRENCY;
  const { toast } = useToast();

  const data = useFinanceData(user?.id, timezone);
  const { budgetsQuery, createMutation, updateMutation, deleteMutation } = useBudgets(user?.id);
  const accounts = useFinanceAccounts(user?.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);

  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
  const [pendingAccountDelete, setPendingAccountDelete] = useState<FinanceAccount | null>(null);

  const expenseCategories = useMemo(
    () => data.categories.filter((category) => category.kind === "expense"),
    [data.categories],
  );

  const progressList = useMemo(
    () => computeAllBudgetProgress(budgetsQuery.data ?? [], data.transactions, data.todayKey),
    [budgetsQuery.data, data.transactions, data.todayKey],
  );

  const totals = useMemo(() => {
    const budgeted = progressList.reduce((sum, item) => sum + item.budget.amount, 0);
    const spent = progressList.reduce((sum, item) => sum + item.spent, 0);
    return { budgeted, spent, remaining: budgeted - spent };
  }, [progressList]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (input: CreateBudgetInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, input });
      toast({ title: "Budget updated" });
    } else {
      await createMutation.mutateAsync(input);
      toast({ title: "Budget created" });
    }
  };

  const handleAccountSubmit = async (input: CreateAccountInput) => {
    if (editingAccount) {
      await accounts.updateMutation.mutateAsync({ id: editingAccount.id, input });
      toast({ title: "Account updated" });
    } else {
      await accounts.createMutation.mutateAsync(input);
      toast({ title: "Account added" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Budgeted" value={formatCurrency(totals.budgeted, currency)} icon={Wallet} />
        <StatCard label="Spent" value={formatCurrency(totals.spent, currency)} icon={Wallet} tone="text-rose-500" />
        <StatCard
          label="Remaining"
          value={formatCurrency(totals.remaining, currency)}
          icon={Wallet}
          tone={totals.remaining < 0 ? "text-rose-500" : "text-emerald-500"}
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Your budgets</h3>
        <Button onClick={openCreate}>
          <Plus size={18} /> New Budget
        </Button>
      </div>

      {budgetsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : progressList.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wallet size={24} />
          </div>
          <h3 className="text-base font-bold text-foreground">No budgets yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create a budget to keep your spending on track this month.
          </p>
          <Button className="mt-1" onClick={openCreate}>
            <Plus size={18} /> New Budget
          </Button>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {progressList.map((progress) => (
            <BudgetCard
              key={progress.budget.id}
              progress={progress}
              category={
                progress.budget.categoryId
                  ? data.categoriesById.get(progress.budget.categoryId)
                  : undefined
              }
              currency={currency}
              onEdit={(budget) => {
                setEditing(budget);
                setFormOpen(true);
              }}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-bold text-foreground">Accounts</h3>
        <Button
          variant="outline"
          onClick={() => {
            setEditingAccount(null);
            setAccountFormOpen(true);
          }}
        >
          <Plus size={16} /> New Account
        </Button>
      </div>

      {accounts.accountsQuery.isLoading ? (
        <Skeleton className="h-20 rounded-2xl" />
      ) : data.accounts.length === 0 ? (
        <GlassCard className="py-8 text-center text-sm text-muted-foreground">
          No accounts yet. Add cash, bank, cards, or wallets to track balances.
        </GlassCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.accounts.map((account) => {
            const classes = getFinanceColorClasses(account.color);
            const Icon = getFinanceIcon(account.icon);
            return (
              <GlassCard key={account.id} className="flex items-center gap-3 p-4">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", classes.chip, classes.icon)}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[account.type]}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="Account actions"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <MoreVertical size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditingAccount(account);
                        setAccountFormOpen(true);
                      }}
                      className="cursor-pointer gap-2"
                    >
                      <Pencil size={15} /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setPendingAccountDelete(account)}
                      className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 size={15} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </GlassCard>
            );
          })}
        </div>
      )}

      <BudgetFormDialog
        open={formOpen}
        budget={editing}
        expenseCategories={expenseCategories}
        saving={createMutation.isPending || updateMutation.isPending}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <AccountFormDialog
        open={accountFormOpen}
        account={editingAccount}
        saving={accounts.createMutation.isPending || accounts.updateMutation.isPending}
        onOpenChange={setAccountFormOpen}
        onSubmit={handleAccountSubmit}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this budget?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.name}” will be removed. Your transactions are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingAccountDelete !== null}
        onOpenChange={(open) => !open && setPendingAccountDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingAccountDelete?.name}” will be removed. Linked transactions are kept but lose
              their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingAccountDelete) accounts.deleteMutation.mutate(pendingAccountDelete.id);
                setPendingAccountDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BudgetsPage;
