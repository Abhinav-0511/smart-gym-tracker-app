import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/types/database";
import { throwIfError } from "@/features/finance/services/errors";
import type {
  Budget,
  BudgetPeriod,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/features/finance/types/budget";
import type { FinanceColor } from "@/features/finance/types/common";

function mapBudget(row: Tables<"budgets">): Budget {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    name: row.name,
    amount: row.amount,
    period: row.period as BudgetPeriod,
    color: row.color as FinanceColor,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchBudgets(userId: string): Promise<Budget[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  throwIfError(error);
  return (data ?? []).map(mapBudget);
}

export async function createBudget(
  userId: string,
  input: CreateBudgetInput,
): Promise<Budget> {
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: userId,
      category_id: input.categoryId,
      name: input.name.trim(),
      amount: input.amount,
      period: input.period,
      color: input.color,
    })
    .select("*")
    .single();

  throwIfError(error);
  return mapBudget(data as Tables<"budgets">);
}

export async function updateBudget(
  budgetId: string,
  input: UpdateBudgetInput,
): Promise<Budget> {
  const patch: TablesUpdate<"budgets"> = {};
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.amount !== undefined) patch.amount = input.amount;
  if (input.period !== undefined) patch.period = input.period;
  if (input.color !== undefined) patch.color = input.color;

  const { data, error } = await supabase
    .from("budgets")
    .update(patch)
    .eq("id", budgetId)
    .select("*")
    .single();

  throwIfError(error);
  return mapBudget(data as Tables<"budgets">);
}

export async function deleteBudget(budgetId: string): Promise<void> {
  const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
  throwIfError(error);
}
