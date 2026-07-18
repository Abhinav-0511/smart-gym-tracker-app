import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * End-to-end tests for the offline write → queue → push loop against a real
 * (in-memory) IndexedDB. Connectivity and the network push are the only mocked
 * pieces, so these exercise the actual Dexie transactions, queue ordering, and
 * SyncController drain/backoff logic — the parts most likely to lose or
 * duplicate data.
 */

// Hoisted so the mock factories can reference them before module init (TDZ-safe).
const { pushItemMock, conn } = vi.hoisted(() => ({
  pushItemMock: vi.fn<(item: unknown) => Promise<void>>(),
  conn: { reachable: true },
}));

vi.mock("@/offline/sync/push", () => ({ pushItem: pushItemMock }));
vi.mock("@/offline/connectivity", () => ({
  connectivity: {
    isReachable: () => conn.reachable,
    getState: () => (conn.reachable ? "online" : "offline"),
    subscribe: () => () => {},
  },
}));

import { db } from "@/offline/db";
import { localDelete, localInsert, localUpdate } from "@/offline/repository";
import { syncController } from "@/offline/sync/controller";
import type { SyncQueueItem } from "@/offline/types";

const USER = "user-1";

function newBudget(name: string, amount: number) {
  return { user_id: USER, category_id: null, name, amount, period: "monthly", color: "blue" };
}

beforeEach(async () => {
  conn.reachable = true;
  pushItemMock.mockReset();
  pushItemMock.mockResolvedValue(undefined);
  await db.sync_queue.clear();
  await db.budgets.clear();
});

afterEach(() => {
  // Neutralise any pending backoff timer so it cannot touch a later test.
  conn.reachable = false;
});

describe("offline repository writes", () => {
  it("persists the row and queues an insert while offline, without pushing", async () => {
    conn.reachable = false;

    const row = await localInsert("budgets", newBudget("Food", 100), USER);

    expect(row.id).toBeTruthy();
    expect(row.created_at).toBeTruthy();
    expect(row.updated_at).toBeTruthy();

    const stored = await db.budgets.get(row.id);
    expect(stored?.name).toBe("Food");

    const queue = await db.sync_queue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      table: "budgets",
      operation: "insert",
      entityId: row.id,
      status: "pending",
      userId: USER,
    });
    expect(pushItemMock).not.toHaveBeenCalled();
  });

  it("merges a patch on update and queues the full row", async () => {
    conn.reachable = false;
    const row = await localInsert("budgets", newBudget("Food", 100), USER);

    const updated = await localUpdate("budgets", row.id, { amount: 250 });

    expect(updated.amount).toBe(250);
    expect(updated.name).toBe("Food"); // untouched fields preserved
    const queue = (await db.sync_queue.toArray()).filter((i) => i.operation === "update");
    expect(queue[0]?.payload).toMatchObject({ id: row.id, amount: 250, name: "Food" });
  });

  it("removes the row and queues a delete with a null payload", async () => {
    conn.reachable = false;
    const row = await localInsert("budgets", newBudget("Food", 100), USER);

    await localDelete("budgets", row.id);

    expect(await db.budgets.get(row.id)).toBeUndefined();
    const del = (await db.sync_queue.toArray()).find((i) => i.operation === "delete");
    expect(del?.entityId).toBe(row.id);
    expect(del?.payload).toBeNull();
  });
});

describe("sync controller drain", () => {
  it("pushes queued items when online, clears them, and never double-sends", async () => {
    conn.reachable = false;
    const row = await localInsert("budgets", newBudget("Food", 100), USER);

    conn.reachable = true;
    await syncController.push();

    expect(pushItemMock).toHaveBeenCalledTimes(1);
    expect(pushItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: row.id, operation: "insert" }),
    );
    expect(await db.sync_queue.count()).toBe(0);

    // A second drain has nothing to do — proves no duplicate send.
    await syncController.push();
    expect(pushItemMock).toHaveBeenCalledTimes(1);
  });

  it("replays multiple queued mutations in the order they were made", async () => {
    conn.reachable = false;
    const a = await localInsert("budgets", newBudget("A", 1), USER);
    await localUpdate("budgets", a.id, { amount: 2 });
    const b = await localInsert("budgets", newBudget("B", 3), USER);

    const seen: SyncQueueItem[] = [];
    pushItemMock.mockImplementation((item) => {
      seen.push(item as SyncQueueItem);
      return Promise.resolve();
    });

    conn.reachable = true;
    await syncController.push();

    expect(seen.map((i) => i.operation)).toEqual(["insert", "update", "insert"]);
    expect(seen.map((i) => i.entityId)).toEqual([a.id, a.id, b.id]);
    expect(await db.sync_queue.count()).toBe(0);
  });

  it("keeps a failed item queued with backoff, then drains it idempotently on retry", async () => {
    conn.reachable = false;
    const row = await localInsert("budgets", newBudget("Food", 100), USER);
    conn.reachable = true;

    // First attempt fails (e.g. transient network error).
    pushItemMock.mockRejectedValueOnce(new Error("network down"));
    await syncController.push();

    const failed = await db.sync_queue.toArray();
    expect(failed).toHaveLength(1); // NOT lost
    expect(failed[0].status).toBe("failed");
    expect(failed[0].retryCount).toBe(1);
    expect(failed[0].nextAttemptAt).toBeTruthy();

    // Simulate the backoff window elapsing, then retry — same item re-sent.
    await db.sync_queue.update(failed[0].seq as number, { nextAttemptAt: null });
    await syncController.push();

    expect(pushItemMock).toHaveBeenCalledTimes(2); // retried the same mutation
    expect(pushItemMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ entityId: row.id }),
    );
    expect(await db.sync_queue.count()).toBe(0); // eventually consistent, no dup
  });

  it("does not push while offline", async () => {
    conn.reachable = false;
    await localInsert("budgets", newBudget("Food", 100), USER);

    await syncController.push();

    expect(pushItemMock).not.toHaveBeenCalled();
    expect(await db.sync_queue.count()).toBe(1);
  });
});
