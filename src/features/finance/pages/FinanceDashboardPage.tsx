import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Plus,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import CategoryChip from "@/features/finance/components/CategoryChip";
import CategoryPieChart, { type CategorySlice } from "@/features/finance/components/CategoryPieChart";
import MonthNav from "@/features/finance/components/MonthNav";
import SpendingTrendChart from "@/features/finance/components/SpendingTrendChart";
import StatCard from "@/features/finance/components/StatCard";
import TransactionFormDialog from "@/features/finance/components/TransactionFormDialog";
import TransactionItem from "@/features/finance/components/TransactionItem";
import { useBudgets } from "@/features/finance/hooks/useBudgets";
import { useFinanceData } from "@/features/finance/hooks/useFinanceData";
import { useRecurring } from "@/features/finance/hooks/useRecurring";
import { useTransactions } from "@/features/finance/hooks/useTransactions";
import { computeAllBudgetProgress } from "@/features/finance/lib/budget-progress";
import { addDays, formatDayLabel } from "@/features/finance/lib/dates";
import { getFinanceColorClasses, getFinanceColorHex } from "@/features/finance/lib/finance-colors";
import { sortByRecency } from "@/features/finance/lib/filters";
import { computeMonthSummary } from "@/features/finance/lib/finance-summary";
import { formatCurrency } from "@/features/finance/lib/money";
import { DEFAULT_CURRENCY } from "@/features/finance/types/common";
import type { CreateTransactionInput } from "@/features/finance/types/transaction";
import { cn } from "@/lib/utils";

interface FinanceDashboardPageProps {
  onNavigate: (page: string) => void;
}

const FinanceDashboardPage = ({ onNavigate }: FinanceDashboardPageProps) => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const currency = DEFAULT_CURRENCY;
  const { toast } = useToast();

  const data = useFinanceData(user?.id, timezone);
  const { createMutation } = useTransactions(user?.id, timezone);
  const { budgetsQuery } = useBudgets(user?.id);
  const { recurringQuery, postMutation } = useRecurring(user?.id);

  const [month, setMonth] = useState(data.monthKey);
  const [formOpen, setFormOpen] = useState(false);

  const summary = useMemo(
    () => computeMonthSummary(data.transactions, month),
    [data.transactions, month],
  );

  const netBalance = useMemo(
    () => data.accounts.reduce((sum, account) => sum + account.balance, 0),
    [data.accounts],
  );

  const pieSlices = useMemo<CategorySlice[]>(() => {
    const top = summary.topExpenseCategories.slice(0, 5).map((entry) => {
      const category = entry.categoryId ? data.categoriesById.get(entry.categoryId) : undefined;
      return {
        name: category?.name ?? "Uncategorized",
        value: entry.amount,
        color: getFinanceColorHex(category?.color ?? "slate"),
      };
    });
    const rest = summary.topExpenseCategories.slice(5);
    if (rest.length > 0) {
      top.push({
        name: "Other",
        value: rest.reduce((sum, entry) => sum + entry.amount, 0),
        color: getFinanceColorHex("slate"),
      });
    }
    return top;
  }, [summary.topExpenseCategories, data.categoriesById]);

  const dailySpend = useMemo(
    () => summary.daily.map((point) => ({ label: point.label, value: point.expense })),
    [summary.daily],
  );

  const recent = useMemo(() => sortByRecency(data.transactions).slice(0, 5), [data.transactions]);

  const topBudgets = useMemo(
    () => computeAllBudgetProgress(budgetsQuery.data ?? [], data.transactions, data.todayKey).slice(0, 3),
    [budgetsQuery.data, data.transactions, data.todayKey],
  );

  const upcomingBills = useMemo(() => {
    const horizon = addDays(data.todayKey, 30);
    return (recurringQuery.data ?? [])
      .filter((item) => item.isActive && item.nextRunOn <= horizon)
      .slice(0, 4);
  }, [recurringQuery.data, data.todayKey]);

  const handleCreate = async (input: CreateTransactionInput) => {
    await createMutation.mutateAsync(input);
    toast({ title: "Transaction added" });
  };

  const handlePost = (recurringId: string) => {
    const recurring = (recurringQuery.data ?? []).find((item) => item.id === recurringId);
    if (!recurring) return;
    postMutation.mutate(recurring, {
      onSuccess: () => toast({ title: `Posted ${recurring.title}` }),
      onError: (error) =>
        toast({
          title: "Couldn’t post",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        }),
    });
  };

  if (data.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const stats = [
    { label: "Income", value: formatCurrency(summary.income, currency), icon: TrendingUp, tone: "text-emerald-500" },
    { label: "Expenses", value: formatCurrency(summary.expense, currency), icon: TrendingDown, tone: "text-rose-500" },
    { label: "Savings", value: formatCurrency(summary.savings, currency), icon: Wallet },
    { label: "Savings rate", value: `${summary.savingsRate}%`, icon: Scale },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthNav monthKey={month} onChange={setMonth} maxMonthKey={data.monthKey} />
        <Button onClick={() => setFormOpen(true)} className="shrink-0">
          <Plus size={18} /> Add Transaction
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <GlassCard className="lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Daily spending</h3>
            <span className="text-xs text-muted-foreground">
              Net {formatCurrency(summary.net, currency)}
            </span>
          </div>
          <div className="h-56">
            {summary.expense > 0 ? (
              <SpendingTrendChart data={dailySpend} currency={currency} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No spending recorded this month.
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="mb-2 text-sm font-bold text-foreground">Top categories</h3>
          {pieSlices.length > 0 ? (
            <>
              <div className="h-40">
                <CategoryPieChart data={pieSlices} currency={currency} />
              </div>
              <div className="mt-3 space-y-1.5">
                {pieSlices.map((slice) => (
                  <div key={slice.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                    <span className="flex-1 truncate text-muted-foreground">{slice.name}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(slice.value, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No expenses yet.
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Recent transactions</h3>
            <button
              onClick={() => onNavigate("transactions")}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>
          {recent.length > 0 ? (
            <div className="space-y-2">
              {recent.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  category={tx.categoryId ? data.categoriesById.get(tx.categoryId) : undefined}
                  currency={currency}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet — add your first one.
            </p>
          )}
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Budgets</h3>
              <button
                onClick={() => onNavigate("budgets")}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Manage <ArrowRight size={13} />
              </button>
            </div>
            {topBudgets.length > 0 ? (
              <div className="space-y-3">
                {topBudgets.map((progress) => (
                    <div key={progress.budget.id}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate font-semibold text-foreground">{progress.budget.name}</span>
                        <span className={cn(progress.isOver ? "text-rose-500" : "text-muted-foreground")}>
                          {formatCurrency(progress.spent, currency)} / {formatCurrency(progress.budget.amount, currency)}
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            progress.isOver ? "bg-rose-500" : getFinanceColorClasses(progress.budget.color).solid,
                          )}
                          style={{ width: `${Math.max(progress.percent, progress.spent > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No budgets set yet.</p>
            )}
          </GlassCard>

          <GlassCard>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Upcoming bills</h3>
              <CalendarClock size={16} className="text-muted-foreground" />
            </div>
            {upcomingBills.length > 0 ? (
              <div className="space-y-2">
                {upcomingBills.map((bill) => {
                  const category = bill.categoryId ? data.categoriesById.get(bill.categoryId) : undefined;
                  return (
                    <div key={bill.id} className="flex items-center gap-3 rounded-xl bg-secondary/40 p-2.5">
                      <CategoryChip category={category} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{bill.title}</p>
                        <p className="text-xs text-muted-foreground">Due {formatDayLabel(bill.nextRunOn)}</p>
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatCurrency(bill.amount, currency)}</span>
                      <Button size="sm" variant="outline" disabled={postMutation.isPending} onClick={() => handlePost(bill.id)}>
                        Post
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No bills due in the next 30 days.</p>
            )}
          </GlassCard>
        </div>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Net worth</h3>
          <span className="text-lg font-extrabold text-foreground">{formatCurrency(netBalance, currency)}</span>
        </div>
        {data.accounts.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.accounts.map((account) => (
              <div key={account.id} className="rounded-xl bg-secondary/40 px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground">{account.name}</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(account.balance, account.currency)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Add accounts from the Budgets page to track balances.
          </p>
        )}
      </GlassCard>

      <TransactionFormDialog
        open={formOpen}
        transaction={null}
        categories={data.categories}
        accounts={data.accounts}
        defaultDateKey={data.todayKey}
        saving={createMutation.isPending}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default FinanceDashboardPage;
