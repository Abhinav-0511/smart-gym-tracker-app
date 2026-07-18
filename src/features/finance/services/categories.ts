import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/types/database";
import { DEFAULT_CATEGORIES, slugifyCategory } from "@/features/finance/lib/default-categories";
import { throwIfError } from "@/features/finance/services/errors";
import type { LocalRow } from "@/offline/db";
import { connectivity } from "@/offline/connectivity";
import {
  localDelete,
  localInsert,
  localRowsByUser,
  localRowsByUserIncludingDeleted,
  localUpdate,
  pullMirror,
} from "@/offline/repository";
import type { FinanceColor } from "@/features/finance/types/common";
import type {
  CategoryKind,
  CreateCategoryInput,
  TransactionCategory,
  UpdateCategoryInput,
} from "@/features/finance/types/category";

function mapCategory(row: Tables<"transaction_categories">): TransactionCategory {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug,
    kind: row.kind as CategoryKind,
    icon: row.icon,
    color: row.color as FinanceColor,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchServerCategoryRows(userId: string): Promise<LocalRow[]> {
  const { data, error } = await supabase
    .from("transaction_categories")
    .select("*")
    .eq("user_id", userId);
  throwIfError(error);
  return (data ?? []) as unknown as LocalRow[];
}

export async function fetchCategories(userId: string): Promise<TransactionCategory[]> {
  await pullMirror("transaction_categories", () => fetchServerCategoryRows(userId));

  const rows = await localRowsByUser("transaction_categories", userId);
  rows.sort((a, b) => {
    const ak = (a.kind as string) ?? "";
    const bk = (b.kind as string) ?? "";
    if (ak !== bk) return ak < bk ? -1 : 1;
    const asort = (a.sort_order as number) ?? 0;
    const bsort = (b.sort_order as number) ?? 0;
    if (asort !== bsort) return asort - bsort;
    return ((a.name as string) ?? "").localeCompare((b.name as string) ?? "");
  });
  return rows.map((row) => mapCategory(row as unknown as Tables<"transaction_categories">));
}

/**
 * Idempotently seed the default categories for a user. Uses an upsert that
 * ignores rows already present (by the unique user_id/kind/slug index), so it is
 * safe to call on every load. Returns the full category list afterwards.
 */
export async function ensureDefaultCategories(
  userId: string,
): Promise<TransactionCategory[]> {
  const existing = await fetchCategories(userId);

  // Build the "already present" set from ALL cached rows including tombstones:
  // a soft-deleted default still occupies its (kind,slug) on the server's unique
  // index, so re-seeding it would fail the push. Treating it as present means a
  // default the user deleted stays deleted (they can re-create it manually).
  const allRows = await localRowsByUserIncludingDeleted("transaction_categories", userId);
  const present = new Set(allRows.map((row) => `${row.kind as string}:${row.slug as string}`));
  const missing = DEFAULT_CATEGORIES.filter(
    (seed) => !present.has(`${seed.kind}:${seed.slug}`),
  );

  if (missing.length === 0) return existing;

  // Seeding relies on the server's unique (user_id,kind,slug) index for
  // idempotency, so it only runs online. Offline, we return whatever is cached;
  // defaults get seeded on the next online load.
  if (!connectivity.isReachable()) return existing;

  const rows = missing.map((seed, index) => ({
    user_id: userId,
    name: seed.name,
    slug: seed.slug,
    kind: seed.kind,
    icon: seed.icon,
    color: seed.color,
    is_default: true,
    sort_order: index,
  }));

  const { error } = await supabase
    .from("transaction_categories")
    .upsert(rows, { onConflict: "user_id,kind,slug", ignoreDuplicates: true });

  throwIfError(error);
  return fetchCategories(userId);
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput,
): Promise<TransactionCategory> {
  const row = await localInsert(
    "transaction_categories",
    {
      user_id: userId,
      name: input.name.trim(),
      slug: input.slug?.trim() || slugifyCategory(input.name),
      kind: input.kind,
      icon: input.icon,
      color: input.color,
      is_default: false,
      sort_order: input.sortOrder ?? 100,
    },
    userId,
  );
  return mapCategory(row as unknown as Tables<"transaction_categories">);
}

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<TransactionCategory> {
  const patch: TablesUpdate<"transaction_categories"> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.color !== undefined) patch.color = input.color;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const row = await localUpdate("transaction_categories", categoryId, patch);
  return mapCategory(row as unknown as Tables<"transaction_categories">);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  // Soft delete (tombstone) rather than a hard delete, so the removal syncs to
  // other devices without being resurrected by a pull. The category vanishes
  // from every list; transactions that still reference it render as
  // "Uncategorized" because the lookup map is built from live categories only.
  await localDelete("transaction_categories", categoryId);
}
