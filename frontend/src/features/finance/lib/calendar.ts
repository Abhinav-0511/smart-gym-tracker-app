// Pure month-grid construction for the Finance calendar view. Produces a fixed
// 42-cell (6-week) grid with each day's income/expense/net rolled up, so the
// calendar component stays a dumb renderer.

import {
  addDays,
  monthKeyOf,
  startOfMonthKey,
  toDateKey,
  weekdayOfKey,
} from "@/features/finance/lib/dates";
import type { Transaction } from "@/features/finance/types/transaction";

export interface CalendarDay {
  dateKey: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
}

/** Weekday headers, Monday-first, matching the grid layout. */
export const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Build a 42-cell grid for `monthKey`, Monday-first. Each cell aggregates the
 * transactions that occurred that day.
 */
export function buildMonthGrid(
  monthKey: string,
  transactions: Transaction[],
  todayKey: string,
): CalendarDay[] {
  const firstOfMonth = startOfMonthKey(monthKey);
  const weekday = weekdayOfKey(firstOfMonth); // 0 = Sun … 6 = Sat
  const offsetToMonday = weekday === 0 ? 6 : weekday - 1;
  const gridStart = addDays(firstOfMonth, -offsetToMonday);

  // Bucket transactions by day for O(n) lookup.
  const byDay = new Map<string, { income: number; expense: number; count: number }>();
  for (const tx of transactions) {
    const bucket = byDay.get(tx.occurredOn) ?? { income: 0, expense: 0, count: 0 };
    bucket.count += 1;
    if (tx.type === "income") bucket.income += tx.amount;
    else if (tx.type === "expense") bucket.expense += tx.amount;
    byDay.set(tx.occurredOn, bucket);
  }

  const cells: CalendarDay[] = [];
  for (let index = 0; index < 42; index += 1) {
    const dateKey = addDays(gridStart, index);
    const bucket = byDay.get(dateKey) ?? { income: 0, expense: 0, count: 0 };
    cells.push({
      dateKey,
      dayOfMonth: Number(dateKey.slice(8, 10)),
      inCurrentMonth: monthKeyOf(dateKey) === monthKey,
      isToday: dateKey === todayKey,
      income: bucket.income,
      expense: bucket.expense,
      net: bucket.income - bucket.expense,
      transactionCount: bucket.count,
    });
  }
  return cells;
}

/** The transactions that occurred on a specific day, newest-first by time. */
export function transactionsOnDay(
  transactions: Transaction[],
  dateKey: string,
): Transaction[] {
  return transactions
    .filter((tx) => tx.occurredOn === dateKey)
    .sort((a, b) => (b.occurredAt ?? "").localeCompare(a.occurredAt ?? ""));
}

/** Today's date key in UTC (grid comparisons are all UTC date keys). */
export function todayKeyUtc(): string {
  return toDateKey(new Date());
}
