// Pure derivation of dashboard aggregates from a flat list of transactions.
// Nothing here touches the network — it is unit-tested in isolation.

import { clampPercent } from "@/features/finance/lib/money";
import {
  daysInMonth,
  isInMonth,
  startOfMonthKey,
} from "@/features/finance/lib/dates";
import type { Transaction } from "@/features/finance/types/transaction";

export interface CategorySpend {
  categoryId: string | null;
  amount: number;
  count: number;
}

export interface DailyPoint {
  dateKey: string;
  /** Day-of-month label, e.g. "1", "2" … for chart axes. */
  label: string;
  income: number;
  expense: number;
}

export interface MonthSummary {
  monthKey: string;
  income: number;
  expense: number;
  /** income - expense; may be negative when overspending. */
  net: number;
  /** Positive savings only (max(0, net)). */
  savings: number;
  /** 0–100 share of income kept. */
  savingsRate: number;
  transactionCount: number;
  topExpenseCategories: CategorySpend[];
  topIncomeCategories: CategorySpend[];
  daily: DailyPoint[];
}

function rankByCategory(transactions: Transaction[]): CategorySpend[] {
  const byCategory = new Map<string | null, CategorySpend>();
  for (const tx of transactions) {
    const existing = byCategory.get(tx.categoryId);
    if (existing) {
      existing.amount += tx.amount;
      existing.count += 1;
    } else {
      byCategory.set(tx.categoryId, {
        categoryId: tx.categoryId,
        amount: tx.amount,
        count: 1,
      });
    }
  }
  return [...byCategory.values()].sort((a, b) => b.amount - a.amount);
}

/** Build the full month summary for the given `YYYY-MM` month. */
export function computeMonthSummary(
  transactions: Transaction[],
  monthKey: string,
): MonthSummary {
  const inMonth = transactions.filter((tx) => isInMonth(tx.occurredOn, monthKey));
  const incomeTx = inMonth.filter((tx) => tx.type === "income");
  const expenseTx = inMonth.filter((tx) => tx.type === "expense");

  const income = incomeTx.reduce((sum, tx) => sum + tx.amount, 0);
  const expense = expenseTx.reduce((sum, tx) => sum + tx.amount, 0);
  const net = income - expense;
  const savings = Math.max(0, net);
  const savingsRate = income > 0 ? clampPercent((net / income) * 100) : 0;

  // Daily income/expense buckets across the whole month (zero-filled).
  const totalDays = daysInMonth(monthKey);
  const firstDay = startOfMonthKey(monthKey);
  const daily: DailyPoint[] = [];
  const byDay = new Map<string, { income: number; expense: number }>();
  for (const tx of inMonth) {
    if (tx.type === "transfer") continue;
    const bucket = byDay.get(tx.occurredOn) ?? { income: 0, expense: 0 };
    if (tx.type === "income") bucket.income += tx.amount;
    else bucket.expense += tx.amount;
    byDay.set(tx.occurredOn, bucket);
  }
  for (let day = 0; day < totalDays; day += 1) {
    const dateKey = `${firstDay.slice(0, 8)}${String(day + 1).padStart(2, "0")}`;
    const bucket = byDay.get(dateKey) ?? { income: 0, expense: 0 };
    daily.push({ dateKey, label: String(day + 1), income: bucket.income, expense: bucket.expense });
  }

  return {
    monthKey,
    income,
    expense,
    net,
    savings,
    savingsRate,
    transactionCount: inMonth.length,
    topExpenseCategories: rankByCategory(expenseTx),
    topIncomeCategories: rankByCategory(incomeTx),
    daily,
  };
}

/** Rolling total of income/expense/net over the last `days` calendar days. */
export function computeRecentTotals(
  transactions: Transaction[],
  fromDateKey: string,
  toDateKey: string,
): { income: number; expense: number; net: number } {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (tx.occurredOn < fromDateKey || tx.occurredOn > toDateKey) continue;
    if (tx.type === "income") income += tx.amount;
    else if (tx.type === "expense") expense += tx.amount;
  }
  return { income, expense, net: income - expense };
}
