import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Verifies how a queued mutation maps onto a Supabase call — in particular that
 * habit_logs inserts upsert on the natural (habit_id, log_date) key while other
 * tables upsert on the primary key, and that update/delete target the row id.
 */
type Result = { error: { message: string } | null };
const spies = vi.hoisted(() => ({
  upsert: vi.fn(
    (_table: string, _values: unknown, _options?: unknown): Promise<Result> =>
      Promise.resolve({ error: null }),
  ),
  update: vi.fn((_table: string, _values: unknown): void => {}),
  updateEq: vi.fn(
    (_col: string, _val: string): Promise<Result> => Promise.resolve({ error: null }),
  ),
  del: vi.fn((_table: string): void => {}),
  deleteEq: vi.fn(
    (_col: string, _val: string): Promise<Result> => Promise.resolve({ error: null }),
  ),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => ({
      upsert: (values: unknown, options?: unknown) => spies.upsert(table, values, options),
      update: (values: unknown) => {
        spies.update(table, values);
        return { eq: (col: string, val: string) => spies.updateEq(col, val) };
      },
      delete: () => {
        spies.del(table);
        return { eq: (col: string, val: string) => spies.deleteEq(col, val) };
      },
    }),
  },
}));

import { pushItem } from "@/offline/sync/push";
import type { SyncQueueItem } from "@/offline/types";

function item(over: Partial<SyncQueueItem>): SyncQueueItem {
  return {
    id: "q1",
    table: "budgets",
    entityId: "e1",
    operation: "insert",
    payload: { id: "e1" },
    timestamp: "t",
    retryCount: 0,
    nextAttemptAt: null,
    lastError: null,
    status: "pending",
    userId: "u1",
    deviceId: "d1",
    ...over,
  };
}

beforeEach(() => {
  Object.values(spies).forEach((s) => s.mockClear());
});

describe("pushItem", () => {
  it("upserts a habit_logs insert on the (habit_id, log_date) natural key", async () => {
    const payload = { id: "e1", habit_id: "h1", log_date: "2026-07-19", completed: true };
    await pushItem(item({ table: "habit_logs", operation: "insert", payload }));

    expect(spies.upsert).toHaveBeenCalledWith("habit_logs", payload, {
      onConflict: "habit_id,log_date",
    });
  });

  it("upserts other inserts on the primary key (no onConflict)", async () => {
    await pushItem(item({ table: "budgets", operation: "insert", payload: { id: "e1" } }));
    expect(spies.upsert).toHaveBeenCalledWith("budgets", { id: "e1" }, undefined);
  });

  it("routes an update to update().eq(id)", async () => {
    await pushItem(item({ operation: "update", payload: { id: "e1", amount: 5 } }));
    expect(spies.update).toHaveBeenCalledWith("budgets", { id: "e1", amount: 5 });
    expect(spies.updateEq).toHaveBeenCalledWith("id", "e1");
  });

  it("routes a delete to delete().eq(id)", async () => {
    await pushItem(item({ operation: "delete", payload: null }));
    expect(spies.del).toHaveBeenCalledWith("budgets");
    expect(spies.deleteEq).toHaveBeenCalledWith("id", "e1");
  });

  it("throws on a Supabase error so the caller can back off", async () => {
    spies.upsert.mockResolvedValueOnce({ error: { message: "boom" } });
    await expect(
      pushItem(item({ operation: "insert", payload: { id: "e1" } })),
    ).rejects.toThrow("boom");
  });
});
