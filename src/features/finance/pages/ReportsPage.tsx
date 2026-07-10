import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Receipt,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import CategoryPieChart, { type CategorySlice } from "@/features/finance/components/CategoryPieChart";
import IncomeExpenseChart from "@/features/finance/components/IncomeExpenseChart";
import MonthNav from "@/features/finance/components/MonthNav";
import StatCard from "@/features/finance/components/StatCard";
import { useFinanceData } from "@/features/finance/hooks/useFinanceData";
import { buildFinanceReport } from "@/features/finance/lib/analytics";
import { buildMonthGrid } from "@/features/finance/lib/calendar";
import { formatDayLabel, isInMonth } from "@/features/finance/lib/dates";
import { getFinanceColorHex } from "@/features/finance/lib/finance-colors";
import { formatCurrency } from "@/features/finance/lib/money";
import { DEFAULT_CURRENCY, PAYMENT_METHOD_LABELS } from "@/features/finance/types/common";
import { cn } from "@/lib/utils";

const ReportsPage = () => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const currency = DEFAULT_CURRENCY;

  const data = useFinanceData(user?.id, timezone);
  const [month, setMonth] = useState(data.monthKey);

  const report = useMemo(
    () => buildFinanceReport({ transactions: data.transactions, monthKey: month, trailingMonths: 6 }),
    [data.transactions, month],
  );

  const pieSlices = useMemo<CategorySlice[]>(
    () =>
      report.topExpenseCategories.slice(0, 6).map((entry) => {
        const category = entry.categoryId ? data.categoriesById.get(entry.categoryId) : undefined;
        return {
          name: category?.name ?? "Uncategorized",
          value: entry.amount,
          color: getFinanceColorHex(category?.color ?? "slate"),
        };
      }),
    [report.topExpenseCategories, data.categoriesById],
  );

  const heatmap = useMemo(() => {
    const cells = buildMonthGrid(
      month,
      data.transactions.filter((tx) => isInMonth(tx.occurredOn, month)),
      data.todayKey,
    );
    const max = Math.max(1, ...cells.map((cell) => cell.expense));
    return { cells, max };
  }, [month, data.transactions, data.todayKey]);

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

  const changeBadge = (pct: number | null, invert = false) => {
    if (pct === null) return <span className="text-xs text-muted-foreground">—</span>;
    const isUp = pct >= 0;
    const good = invert ? !isUp : isUp;
    return (
      <span className={cn("flex items-center gap-0.5 text-xs font-semibold", good ? "text-emerald-500" : "text-rose-500")}>
        {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {Math.abs(pct)}%
      </span>
    );
  };

  const highlights = [
    {
      label: "Largest expense",
      primary: report.largestExpense ? formatCurrency(report.largestExpense.amount, currency) : "—",
      secondary: report.largestExpense?.title ?? "No expenses",
      icon: TrendingDown,
    },
    {
      label: "Highest income",
      primary: report.highestIncome ? formatCurrency(report.highestIncome.amount, currency) : "—",
      secondary: report.highestIncome?.title ?? "No income",
      icon: TrendingUp,
    },
    {
      label: "Most expensive day",
      primary: report.mostExpensiveDay ? formatCurrency(report.mostExpensiveDay.amount, currency) : "—",
      secondary: report.mostExpensiveDay ? formatDayLabel(report.mostExpensiveDay.dateKey) : "—",
      icon: CalendarClock,
    },
    {
      label: "Top payment method",
      primary: report.mostUsedPaymentMethod
        ? PAYMENT_METHOD_LABELS[report.mostUsedPaymentMethod.method]
        : "—",
      secondary: report.mostUsedPaymentMethod
        ? `${report.mostUsedPaymentMethod.count} transactions`
        : "—",
      icon: Receipt,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-center sm:justify-start">
        <MonthNav monthKey={month} onChange={setMonth} maxMonthKey={data.monthKey} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Income" value={formatCurrency(report.income, currency)} icon={TrendingUp} tone="text-emerald-500" />
        <StatCard label="Expenses" value={formatCurrency(report.expense, currency)} icon={TrendingDown} tone="text-rose-500" />
        <StatCard label="Net" value={formatCurrency(report.net, currency)} icon={Wallet} />
        <StatCard label="Savings rate" value={`${report.savingsRate}%`} icon={Scale} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Avg / day" value={formatCurrency(report.avgDailySpending, currency)} icon={CalendarClock} />
        <StatCard label="Avg txn" value={formatCurrency(report.avgTransactionValue, currency)} icon={Receipt} />
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingDown size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Expense vs last</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-extrabold text-foreground">
              {formatCurrency(report.prevExpense, currency)}
            </span>
            {changeBadge(report.expenseChangePct, true)}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Income vs last</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-extrabold text-foreground">
              {formatCurrency(report.prevIncome, currency)}
            </span>
            {changeBadge(report.incomeChangePct)}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <GlassCard className="lg:col-span-3">
          <h3 className="mb-2 text-sm font-bold text-foreground">Income vs expense (6 months)</h3>
          <div className="h-64">
            <IncomeExpenseChart data={report.trend} currency={currency} />
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="mb-2 text-sm font-bold text-foreground">Category breakdown</h3>
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
              No expenses this month.
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((item) => (
          <GlassCard key={item.label} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <item.icon size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">{item.label}</span>
            </div>
            <p className="mt-1 truncate text-lg font-extrabold text-foreground">{item.primary}</p>
            <p className="truncate text-xs text-muted-foreground">{item.secondary}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h3 className="mb-3 text-sm font-bold text-foreground">Spending heatmap</h3>
        <div className="grid grid-cols-7 gap-1">
          {heatmap.cells.map((cell) => {
            const intensity = cell.expense > 0 ? 0.15 + 0.85 * (cell.expense / heatmap.max) : 0;
            return (
              <div
                key={cell.dateKey}
                title={`${formatDayLabel(cell.dateKey)} · ${formatCurrency(cell.expense, currency)}`}
                className={cn(
                  "aspect-square rounded-md",
                  cell.inCurrentMonth ? "bg-secondary/40" : "opacity-30",
                )}
                style={
                  cell.expense > 0
                    ? { backgroundColor: `hsl(var(--primary) / ${intensity.toFixed(2)})` }
                    : undefined
                }
              />
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Darker days = higher spending. Hover a day for the total.
        </p>
      </GlassCard>
    </div>
  );
};

export default ReportsPage;
