import { useMemo } from "react";
import {
  CreditCard,
  Flame,
  HeartPulse,
  LoaderCircle,
  PiggyBank,
  Receipt,
  Scale,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import AccountSection from "@/components/profile/AccountSection";
import ProfileHero from "@/components/profile/ProfileHero";
import SectionHeader from "@/components/ui/section-header";
import { useAuth } from "@/hooks/useAuth";
import { useBudgets } from "@/features/finance/hooks/useBudgets";
import { useFinanceData } from "@/features/finance/hooks/useFinanceData";
import { useSavingsGoals } from "@/features/finance/hooks/useSavingsGoals";
import { computeAllBudgetProgress } from "@/features/finance/lib/budget-progress";
import {
  computeFinancialHealthScore,
  healthBand,
} from "@/features/finance/lib/financial-health";
import { buildFinanceReport } from "@/features/finance/lib/analytics";
import { formatCurrency } from "@/features/finance/lib/money";
import { DEFAULT_CURRENCY, PAYMENT_METHOD_LABELS } from "@/features/finance/types/common";

const FinanceProfilePage = () => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const currency = DEFAULT_CURRENCY;

  const data = useFinanceData(user?.id, timezone);
  const { budgetsQuery } = useBudgets(user?.id);
  const { goalsQuery } = useSavingsGoals(user?.id);

  const isLoading = data.isLoading || budgetsQuery.isPending || goalsQuery.isPending;

  const metrics = useMemo(() => {
    const report = buildFinanceReport({ transactions: data.transactions, monthKey: data.monthKey });

    const budgets = budgetsQuery.data ?? [];
    const budgetProgress = computeAllBudgetProgress(budgets, data.transactions, data.todayKey);
    const budgetsOver = budgetProgress.filter((entry) => entry.isOver).length;
    const totalBudget = budgetProgress.reduce((sum, entry) => sum + entry.budget.amount, 0);
    const totalSpent = budgetProgress.reduce((sum, entry) => sum + entry.spent, 0);
    const budgetUsage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    const goals = goalsQuery.data ?? [];
    const activeGoals = goals.filter((goal) => goal.status === "active");
    const goalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const goalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

    const monthsTracked = new Set(data.transactions.map((tx) => tx.occurredOn.slice(0, 7))).size;

    const score = computeFinancialHealthScore({
      income: report.income,
      expense: report.expense,
      savingsRate: report.savingsRate,
      budgetsOver,
      budgetsTotal: budgets.length,
    });

    const topCategory = report.topExpenseCategories[0];
    const topCategoryName = topCategory?.categoryId
      ? data.categoriesById.get(topCategory.categoryId)?.name ?? "Uncategorized"
      : topCategory
        ? "Uncategorized"
        : null;

    return {
      report,
      activeBudgets: budgets.length,
      budgetUsage,
      activeGoals: activeGoals.length,
      goalSaved,
      goalTarget,
      monthsTracked,
      score,
      topCategoryName,
    };
  }, [
    data.transactions,
    data.monthKey,
    data.todayKey,
    data.categoriesById,
    budgetsQuery.data,
    goalsQuery.data,
  ]);

  const {
    report,
    activeBudgets,
    budgetUsage,
    activeGoals,
    goalSaved,
    goalTarget,
    monthsTracked,
    score,
    topCategoryName,
  } = metrics;

  return (
    <div className="space-y-6 animate-fade-in">
      <ProfileHero
        eyebrow="Finance Profile"
        accentClassName="from-emerald-500/20 via-emerald-500/5 to-transparent"
        stats={
          isLoading
            ? undefined
            : [
                { label: "health", value: `${score}` },
                { label: "savings rate", value: `${report.savingsRate}%` },
                { label: "months tracked", value: String(monthsTracked) },
              ]
        }
      />

      {isLoading ? (
        <GlassCard className="py-8 text-center" role="status">
          <LoaderCircle className="mx-auto animate-spin text-primary" size={22} />
          <span className="sr-only">Loading financial statistics</span>
        </GlassCard>
      ) : (
        <>
          {/* Financial health banner */}
          <GlassCard className="bg-gradient-to-br from-emerald-500/10 to-transparent">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
                <HeartPulse size={26} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Financial health
                </p>
                <p className="text-3xl font-extrabold tracking-tight text-foreground">
                  {score}
                  <span className="ml-1 text-base font-semibold text-muted-foreground">/100</span>
                </p>
                <p className="text-xs font-medium text-emerald-500">{healthBand(score)}</p>
              </div>
            </div>
          </GlassCard>

          {/* This month */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Income" value={formatCurrency(report.income, currency)} icon={<TrendingUp size={18} />} />
            <StatCard label="Expenses" value={formatCurrency(report.expense, currency)} icon={<TrendingDown size={18} />} />
            <StatCard label="Savings" value={formatCurrency(report.savings, currency)} icon={<Wallet size={18} />} />
            <StatCard label="Savings Rate" value={`${report.savingsRate}%`} icon={<Scale size={18} />} />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Active Budgets" value={activeBudgets} icon={<Wallet size={18} />} />
            <StatCard label="Budget Usage" value={`${budgetUsage}%`} icon={<Scale size={18} />} />
            <StatCard label="Savings Goals" value={activeGoals} icon={<Target size={18} />} />
            <StatCard label="Transactions" value={report.transactionCount} icon={<Receipt size={18} />} />
          </div>

          {/* Insights */}
          <div>
            <SectionHeader className="mb-3" title="Spending insights" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <GlassCard>
                <div className="mb-1 flex items-center gap-2">
                  <TrendingDown size={16} className="text-rose-500" />
                  <h3 className="text-sm font-bold text-foreground">Largest expense</h3>
                </div>
                {report.largestExpense ? (
                  <>
                    <p className="truncate text-base font-semibold text-foreground">
                      {report.largestExpense.title || "Expense"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(report.largestExpense.amount, currency)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No expenses this month.</p>
                )}
              </GlassCard>

              <GlassCard>
                <div className="mb-1 flex items-center gap-2">
                  <Tag size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-foreground">Top category</h3>
                </div>
                {topCategoryName ? (
                  <>
                    <p className="truncate text-base font-semibold text-foreground">{topCategoryName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(report.topExpenseCategories[0]?.amount ?? 0, currency)} spent
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not enough data yet.</p>
                )}
              </GlassCard>

              <GlassCard>
                <div className="mb-1 flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Top payment method</h3>
                </div>
                {report.mostUsedPaymentMethod ? (
                  <>
                    <p className="text-base font-semibold text-foreground">
                      {PAYMENT_METHOD_LABELS[report.mostUsedPaymentMethod.method]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.mostUsedPaymentMethod.count} transactions
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No transactions this month.</p>
                )}
              </GlassCard>
            </div>
          </div>

          {/* Savings goals + financial streak */}
          <div className="grid gap-3 lg:grid-cols-2">
            <GlassCard>
              <div className="mb-2 flex items-center gap-2">
                <PiggyBank size={16} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-foreground">Savings goals</h3>
              </div>
              {goalTarget > 0 ? (
                <>
                  <div className="flex items-end justify-between">
                    <p className="text-base font-semibold text-foreground">
                      {formatCurrency(goalSaved, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of {formatCurrency(goalTarget, currency)}
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-[width]"
                      style={{ width: `${Math.min(100, Math.round((goalSaved / goalTarget) * 100))}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Set a savings goal to start tracking progress.
                </p>
              )}
            </GlassCard>

            <GlassCard>
              <div className="mb-1 flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                <h3 className="text-sm font-bold text-foreground">Financial streak</h3>
              </div>
              <p className="text-2xl font-extrabold text-foreground">
                {monthsTracked}
                <span className="ml-1.5 text-sm font-semibold text-muted-foreground">
                  {monthsTracked === 1 ? "month" : "months"} tracked
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Keep logging transactions to grow your streak.
              </p>
            </GlassCard>
          </div>

          {/* Future-ready */}
          <GlassCard className="border-dashed">
            <div className="mb-1 flex items-center gap-2">
              <Receipt size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">Exported reports</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Downloadable monthly statements are on the way. Coming soon.
            </p>
          </GlassCard>
        </>
      )}

      <AccountSection />
    </div>
  );
};

export default FinanceProfilePage;
