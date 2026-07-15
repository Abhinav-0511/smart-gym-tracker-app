// Timezone-stable date-key helpers. A "date key" is a `YYYY-MM-DD` string. All
// arithmetic is done in UTC so results never shift across DST boundaries.

import type { IsoWeekday } from "@/features/productivity/types/habit";

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

/** ISO weekday (1 = Monday … 7 = Sunday) for a date key, computed in UTC. */
export function isoWeekdayOfKey(key: string): IsoWeekday {
  const day = parseDateKey(key).getUTCDay(); // 0 = Sunday … 6 = Saturday
  return (day === 0 ? 7 : day) as IsoWeekday;
}

/** First-of-month key (`YYYY-MM-01`) for the month the given key falls in. */
export function monthStartKey(key: string): string {
  return `${key.slice(0, 7)}-01`;
}

/** Number of calendar days in the month the given key falls in (UTC, DST-safe). */
export function daysInMonthOfKey(key: string): number {
  const date = parseDateKey(key);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

/** Inclusive list of date keys from `startKey` to `endKey`. */
export function dateKeyRange(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  let cursor = startKey;
  // Guard against inverted ranges producing an unbounded loop.
  let guard = 0;
  while (cursor <= endKey && guard <= 4000) {
    keys.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return keys;
}
