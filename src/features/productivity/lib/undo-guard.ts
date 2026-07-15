import { useCallback, useState } from "react";

import { addDays } from "@/features/productivity/lib/date-keys";

/**
 * Tracks whether a task/habit completion has already been undone *once* for a
 * given day. Completing an item is always reversible the first time (with
 * confirmation); after that single undo is spent, re-completing the item locks
 * it as done for that day. State is persisted in localStorage so the lock
 * survives reloads and is keyed per (kind, id, day) — the day being a real date
 * key, so the guard works for the Calendar (which edits arbitrary days), not
 * just "today".
 *
 * This is a lightweight UX guard (per-device), not an authoritative server rule.
 */
const STORAGE_KEY = "lifetrack.productivity.undoGuard";

/** Entries whose day is older than this (relative to today) are pruned. */
const RETENTION_DAYS = 60;

type UndoStore = Record<string, true>;
export type UndoKind = "task" | "habit";

export function undoGuardKey(kind: UndoKind, id: string, dateKey: string): string {
  return `${kind}:${id}:${dateKey}`;
}

function readStore(): UndoStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UndoStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: UndoStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable (private mode / quota) — the guard degrades to
       in-memory only for this session, which is acceptable for a UX guard. */
  }
}

/** The day segment of a guard key (`kind:id:YYYY-MM-DD`). */
function dayOfGuardKey(key: string): string {
  return key.slice(key.lastIndexOf(":") + 1);
}

/**
 * React binding for the undo guard. Prunes entries older than the retention
 * window on mount so the store never grows unbounded (while still supporting the
 * Calendar's past/future days), and exposes reactive read/consume helpers.
 */
export function useUndoGuard(todayKey: string) {
  const [consumed, setConsumed] = useState<Set<string>>(() => {
    const store = readStore();
    const floor = addDays(todayKey, -RETENTION_DAYS);
    const keptKeys = Object.keys(store).filter((key) => dayOfGuardKey(key) >= floor);
    if (keptKeys.length !== Object.keys(store).length) {
      writeStore(Object.fromEntries(keptKeys.map((key) => [key, true as const])));
    }
    return new Set(keptKeys);
  });

  const isConsumed = useCallback((key: string) => consumed.has(key), [consumed]);

  const consume = useCallback((key: string) => {
    const store = readStore();
    store[key] = true;
    writeStore(store);
    setConsumed((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  return { isConsumed, consume };
}
