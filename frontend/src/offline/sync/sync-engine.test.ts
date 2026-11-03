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

import { db, type LocalRow } from "@/offline/db";
import {
  localDelete,
  localInsert,
  localRowsByUser,
  localUpdate,
  pullMirror,
} from "@/offline/repository";
import { syncController } from "@/offline/sync/controller";
import { startOfflineSync } from "@/offline/sync";
import { deterministicId } from "@/offline/ids";
import { META_KEYS, type SyncQueueItem } from "@/offline/types";

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
  await db.habit_logs.clear();
  await db.metadata.clear();
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

  it("soft-deletes: keeps a tombstone, hides it from reads, queues an update", async () => {
    conn.reachable = false;
    const row = await localInsert("budgets", newBudget("Food", 100), USER);

    await localDelete("budgets", row.id);

    // Row is kept as a tombstone (deleted_at set) so the deletion can propagate…
    const stored = await db.budgets.get(row.id);
    expect(stored?.deleted_at).toBeTruthy();
    // …but it no longer appears in reads.
    const live = await localRowsByUser("budgets", USER);
    expect(live.find((r) => r.id === row.id)).toBeUndefined();
    // …and it syncs as an ordinary update carrying deleted_at (not a hard delete).
    const queued = (await db.sync_queue.toArray()).find(
      (i) => i.entityId === row.id && i.operation === "update",
    );
    expect((queued?.payload as LocalRow | undefined)?.deleted_at).toBeTruthy();
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

  it("stamps last_sync_at after a clean drain", async () => {
    conn.reachable = false;
    await localInsert("budgets", newBudget("Food", 100), USER);
    conn.reachable = true;

    await syncController.push();

    const meta = await db.metadata.get(META_KEYS.lastSyncAt);
    expect(typeof meta?.value).toBe("string");
  });
});

describe("phase 4a hardening", () => {
  it("pull never clobbers a local row that still has an unsynced change", async () => {
    conn.reachable = false;
    const edited = await localInsert("budgets", newBudget("Orig", 10), USER);
    await localUpdate("budgets", edited.id, { name: "LocalEdit" });

    // Pushes fail, so the local change stays queued (pending) throughout the pull.
    conn.reachable = true;
    pushItemMock.mockRejectedValue(new Error("still offline-ish"));

    const serverRows: LocalRow[] = [
      { ...(edited as LocalRow), name: "ServerStale" }, // conflicting, has pending change
      { ...newBudget("Other", 5), id: "server-other", created_at: "x", updated_at: "x" },
    ];
    await pullMirror("budgets", async () => serverRows);

    // Local pending edit wins; the unrelated server row is applied.
    expect((await db.budgets.get(edited.id))?.name).toBe("LocalEdit");
    expect((await db.budgets.get("server-other"))?.name).toBe("Other");
  });

  it("pull applies server rows once no local change is pending", async () => {
    conn.reachable = true;
    const serverRows: LocalRow[] = [
      { ...newBudget("FromServer", 7), id: "srv-1", created_at: "x", updated_at: "x" },
    ];
    await pullMirror("budgets", async () => serverRows);

    expect((await db.budgets.get("srv-1"))?.name).toBe("FromServer");
  });

  it("propagates a tombstone from the server: a remotely-deleted row disappears", async () => {
    // Locally we still have the row as live (e.g. cached before device B deleted it).
    await db.budgets.put({
      ...newBudget("Rent", 1200),
      id: "shared-1",
      created_at: "x",
      updated_at: "x",
    });
    expect((await localRowsByUser("budgets", USER)).some((r) => r.id === "shared-1")).toBe(true);

    // Server now reports it with deleted_at set (deleted on another device).
    conn.reachable = true;
    const serverRows: LocalRow[] = [
      { ...newBudget("Rent", 1200), id: "shared-1", created_at: "x", updated_at: "y", deleted_at: "y" },
    ];
    await pullMirror("budgets", async () => serverRows);

    // The tombstone is stored and the row is filtered out of reads.
    expect((await db.budgets.get("shared-1"))?.deleted_at).toBe("y");
    expect((await localRowsByUser("budgets", USER)).some((r) => r.id === "shared-1")).toBe(false);
  });

  it("recovers an interrupted sync by resetting 'syncing' items to 'pending'", async () => {
    conn.reachable = false;
    const row = await localInsert("budgets", newBudget("Food", 100), USER);
    const item = (await db.sync_queue.toArray())[0];
    // Simulate a crash mid-push: item left stuck as "syncing".
    await db.sync_queue.update(item.seq as number, { status: "syncing" });

    await startOfflineSync();

    const recovered = await db.sync_queue.where("entityId").equals(row.id).first();
    expect(recovered?.status).toBe("pending");
  });
});

describe("habit-log deterministic identity", () => {
  it("is stable per seed and unique across seeds", () => {
    expect(deterministicId("habit-1:2026-07-19")).toBe(deterministicId("habit-1:2026-07-19"));
    expect(deterministicId("habit-1:2026-07-19")).not.toBe(deterministicId("habit-1:2026-07-20"));
    expect(deterministicId("x")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("complete → undo → complete converges to a single toggled row", async () => {
    conn.reachable = false;
    const id = deterministicId("habit-1:2026-07-19");
    const base = { id, habit_id: "habit-1", user_id: USER, log_date: "2026-07-19", value: null };

    await localInsert("habit_logs", { ...base, completed: true }, USER); // complete
    await localInsert("habit_logs", { ...base, completed: false }, USER); // undo
    await localInsert("habit_logs", { ...base, completed: true }, USER); // re-complete

    const rows = await db.habit_logs.where("habit_id").equals("habit-1").toArray();
    expect(rows).toHaveLength(1); // deterministic id ⇒ no duplicate day rows
    expect(rows[0].id).toBe(id);
    expect(rows[0].completed).toBe(true);
  });
});
