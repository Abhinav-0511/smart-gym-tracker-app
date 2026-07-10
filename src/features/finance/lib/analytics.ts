// Pure analytics/report builder for the Reports page. Derives monthly summary,
// month-over-month comparison, averages, extremes, a payment-method breakdown,
// a spending heatmap, and a multi-month trend from raw transactions.

import { addMonths, daysInMonth, isInMonth, shortMonthLabel } from "@/features/finance/lib/dates";
import {
  computeMonthSummary,
  type CategorySpend,
} from "@/features/finance/lib/finance-summary";
import type { PaymentMethod } from "@/features/finance/types/common";
import type { Transaction } from "@/features/finance/types/transaction";

export interface TrendPoint {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface HeatmapCell {
  dateKey: string;
  expense: number;
}

export interface PaymentMethodStat {
  method: PaymentMethod;
  count: number;
  amount: number;
}

export interface FinanceReport {
  monthKey: string;
  income: number;
  expense: number;
  net: number;
  savings: number;
  savingsRate: number;
  transactionCount: number;
  avgDailySpending: number;
  avgTransactionValue: number;
  largestExpense: Transaction | null;
  highestIncome: Transaction | null;
  topExpenseCategories: CategorySpend[];
  paymentMethods: PaymentMethodStat[];
  mostUsedPaymentMethod: PaymentMethodStat | null;
  mostExpensiveDay: { dateKey: string; amount: number } | null;
  prevIncome: number;
  prevExpense: number;
  /** % change vs previous month; null when previous month had none. */
  incomeChangePct: number | null;
  expenseChangePct: number | null;
  trend: TrendPoint[];
  heatmap: HeatmapCell[];
}

interface BuildReportParams {
  transactions: Transaction[];
  monthKey: string;
  /** Number of months (including current) in the trend series. */
  trailingMonths?: number;
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function buildFinanceReport({
  transactions,
  monthKey,
  trailingMonths = 6,
}: BuildReportParams): FinanceReport {
  const summary = computeMonthSummary(transactions, monthKey);
  const inMonth = transactions.filter((tx) => isInMonth(tx.occurredOn, monthKey));
  const expenseTx = inMonth.filter((tx) => tx.type === "expense");
  const incomeTx = inMonth.filter((tx) => tx.type === "income");

  const largestExpense = expenseTx.reduce<Transaction | null>(
    (max, tx) => (!max || tx.amount > max.amount ? tx : max),
    null,
  );
  const highestIncome = incomeTx.reduce<Transaction | null>(
    (max, tx) => (!max || tx.amount > max.amount ? tx : max),
    null,
  );

  const spendingTxCount = expenseTx.length;
  const avgDailySpending = summary.expense / daysInMonth(monthKey);
  const avgTransactionValue = spendingTxCount > 0 ? summary.expense / spendingTxCount : 0;

  // Payment-method usage across all in-month transactions.
  const methodMap = new Map<PaymentMethod, PaymentMethodStat>();
  for (const tx of inMonth) {
    const stat = methodMap.get(tx.paymentMethod) ?? {
      method: tx.paymentMethod,
      count: 0,
      amount: 0,
    };
    stat.count += 1;
    stat.amount += tx.amount;
    methodMap.set(tx.paymentMethod, stat);
  }
  const paymentMethods = [...methodMap.values()].sort((a, b) => b.count - a.count);

  // Most expensive single day.
  const dayMap = new Map<string, number>();
  for (const tx of expenseTx) {
    dayMap.set(tx.occurredOn, (dayMap.get(tx.occurredOn) ?? 0) + tx.amount);
  }
  let mostExpensiveDay: { dateKey: string; amount: number } | null = null;
  for (const [dateKey, amount] of dayMap) {
    if (!mostExpensiveDay || amount > mostExpensiveDay.amount) {
      mostExpensiveDay = { dateKey, amount };
    }
  }
  const heatmap: HeatmapCell[] = [...dayMap.entries()]
    .map(([dateKey, expense]) => ({ dateKey, expense }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  // Previous month comparison.
  const prevMonthKey = addMonths(monthKey, -1);
  const prevSummary = computeMonthSummary(transactions, prevMonthKey);

  // Trailing trend (oldest -> newest).
  const trend: TrendPoint[] = [];
  for (let offset = trailingMonths - 1; offset >= 0; offset -= 1) {
    const key = addMonths(monthKey, -offset);
    const monthSummary = computeMonthSummary(transactions, key);
    trend.push({
      monthKey: key,
      label: shortMonthLabel(key),
      income: monthSummary.income,
      expense: monthSummary.expense,
      net: monthSummary.net,
    });
  }

  return {
    monthKey,
    income: summary.income,
    expense: summary.expense,
    net: summary.net,
    savings: summary.savings,
    savingsRate: summary.savingsRate,
    transactionCount: summary.transactionCount,
    avgDailySpending,
    avgTransactionValue,
    largestExpense,
    highestIncome,
    topExpenseCategories: summary.topExpenseCategories,
    paymentMethods,
    mostUsedPaymentMethod: paymentMethods[0] ?? null,
    mostExpensiveDay,
    prevIncome: prevSummary.income,
    prevExpense: prevSummary.expense,
    incomeChangePct: pctChange(summary.income, prevSummary.income),
    expenseChangePct: pctChange(summary.expense, prevSummary.expense),
    trend,
    heatmap,
  };
}
