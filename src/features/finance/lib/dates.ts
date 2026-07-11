// Timezone-stable date helpers for the Finance module. A "date key" is a
// `YYYY-MM-DD` string and a "month key" is `YYYY-MM`. All arithmetic is done in
// UTC so results never shift across DST boundaries — mirroring the Productivity
// module's date-keys utility.

import type { BudgetPeriod } from "@/features/finance/types/budget";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Format a Date's UTC calendar day as `YYYY-MM-DD`. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse a `YYYY-MM-DD` key into a Date at UTC midnight. */
export function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** Return a new key `days` after (or before, if negative) the given key. */
export function addDays(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

/** Inclusive list of date keys from `startKey` to `endKey`. */
export function dateKeyRange(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  let cursor = startKey;
  let guard = 0;
  while (cursor <= endKey && guard <= 4000) {
    keys.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return keys;
}

/** Weekday of a date key: 0 = Sunday … 6 = Saturday (UTC). */
export function weekdayOfKey(key: string): number {
  return parseDateKey(key).getUTCDay();
}

/** The `YYYY-MM` month key a date key belongs to. */
export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** Whether a date key falls inside a month key. */
export function isInMonth(dateKey: string, monthKey: string): boolean {
  return monthKeyOf(dateKey) === monthKey;
}

/** First day of a month key, e.g. "2026-07" -> "2026-07-01". */
export function startOfMonthKey(monthKey: string): string {
  return `${monthKey}-01`;
}

/** Number of days in a month key. */
export function daysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  // Day 0 of the next month is the last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Last day of a month key, e.g. "2026-07" -> "2026-07-31". */
export function endOfMonthKey(monthKey: string): string {
  return `${monthKey}-${String(daysInMonth(monthKey)).padStart(2, "0")}`;
}

/** Add `count` months to a month key (may be negative). */
export function addMonths(monthKey: string, count: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + count, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Human month label, e.g. "July 2026". */
export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Short human month label, e.g. "Jul 2026". */
export function shortMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`;
}

/** Human day label for a date key, e.g. "10 Jul 2026". */
export function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`;
}

/**
 * Inclusive `{ start, end }` date-key range for the calendar period containing
 * `refKey`. Weeks run Monday→Sunday; months and years are calendar-aligned.
 */
export function periodRange(
  period: BudgetPeriod,
  refKey: string,
): { start: string; end: string } {
  if (period === "monthly") {
    const monthKey = monthKeyOf(refKey);
    return { start: startOfMonthKey(monthKey), end: endOfMonthKey(monthKey) };
  }
  if (period === "yearly") {
    const year = refKey.slice(0, 4);
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  // weekly: Monday as the first day of the week.
  const weekday = weekdayOfKey(refKey); // 0 = Sun … 6 = Sat
  const offsetToMonday = weekday === 0 ? 6 : weekday - 1;
  const start = addDays(refKey, -offsetToMonday);
  return { start, end: addDays(start, 6) };
}
