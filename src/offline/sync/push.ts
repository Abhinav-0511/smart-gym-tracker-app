import { supabase } from "@/lib/supabase";
import type { SyncQueueItem } from "@/offline/types";

/**
 * The sync layer writes rows to a table chosen at runtime, so the strongly-typed
 * Supabase client (which wants a per-table row shape) can't check the payload.
 * We narrow the query builder to just the mutation surface we use, accepting a
 * server-shaped row. This is the one deliberate typing boundary in the engine —
 * the row shape is guaranteed correct because it originated from a `select("*")`
 * or the domain service's own insert/update builder.
 */
interface MutationResult {
  error: { message: string } | null;
}
interface GenericMutableTable {
  upsert(values: Record<string, unknown>): PromiseLike<MutationResult>;
  update(values: Record<string, unknown>): {
    eq(column: string, value: string): PromiseLike<MutationResult>;
  };
  delete(): { eq(column: string, value: string): PromiseLike<MutationResult> };
}

function table(name: SyncQueueItem["table"]): GenericMutableTable {
  return supabase.from(name) as unknown as GenericMutableTable;
}

/**
 * Push a single queued mutation to Supabase.
 *
 * Because rows are stored server-shaped (snake_case, exactly as the table
 * expects), pushing is fully generic — no per-table code. Idempotency is built
 * in so a retry after a partially-applied attempt never duplicates or corrupts:
 *  - insert → `upsert` on the primary key (client-generated id). Re-running is a
 *    no-op if the row already landed.
 *  - update → `update ... eq(id)`. Naturally idempotent.
 *  - delete → `delete ... eq(id)`. Deleting an already-deleted row is a no-op.
 *
 * Throws on a real server/network error so the caller can apply backoff.
 */
export async function pushItem(item: SyncQueueItem): Promise<void> {
  const remote = table(item.table);

  if (item.operation === "delete") {
    const { error } = await remote.delete().eq("id", item.entityId);
    if (error) throw new Error(error.message);
    return;
  }

  if (!item.payload) {
    throw new Error(`Queue item ${item.id} (${item.operation}) has no payload`);
  }

  if (item.operation === "insert") {
    const { error } = await remote.upsert(item.payload);
    if (error) throw new Error(error.message);
    return;
  }

  // update
  const { error } = await remote.update(item.payload).eq("id", item.entityId);
  if (error) throw new Error(error.message);
}
