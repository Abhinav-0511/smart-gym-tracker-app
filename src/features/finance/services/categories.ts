import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/types/database";
import { DEFAULT_CATEGORIES, slugifyCategory } from "@/features/finance/lib/default-categories";
import { throwIfError } from "@/features/finance/services/errors";
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

export async function fetchCategories(userId: string): Promise<TransactionCategory[]> {
  const { data, error } = await supabase
    .from("transaction_categories")
    .select("*")
    .eq("user_id", userId)
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  throwIfError(error);
  return (data ?? []).map(mapCategory);
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
  const present = new Set(existing.map((cat) => `${cat.kind}:${cat.slug}`));
  const missing = DEFAULT_CATEGORIES.filter(
    (seed) => !present.has(`${seed.kind}:${seed.slug}`),
  );

  if (missing.length === 0) return existing;

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
  const { data, error } = await supabase
    .from("transaction_categories")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      slug: input.slug?.trim() || slugifyCategory(input.name),
      kind: input.kind,
      icon: input.icon,
      color: input.color,
      is_default: false,
      sort_order: input.sortOrder ?? 100,
    })
    .select("*")
    .single();

  throwIfError(error);
  return mapCategory(data as Tables<"transaction_categories">);
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

  const { data, error } = await supabase
    .from("transaction_categories")
    .update(patch)
    .eq("id", categoryId)
    .select("*")
    .single();

  throwIfError(error);
  return mapCategory(data as Tables<"transaction_categories">);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  // Transactions referencing this category have category_id set to NULL by the
  // FK's ON DELETE SET NULL, preserving their history as "Uncategorized".
  const { error } = await supabase
    .from("transaction_categories")
    .delete()
    .eq("id", categoryId);
  throwIfError(error);
}
