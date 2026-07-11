import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/types/database";
import { throwIfError } from "@/features/finance/services/errors";
import type { FinanceColor } from "@/features/finance/types/common";
import type {
  CreateSavingsGoalInput,
  SavingsGoal,
  SavingsGoalStatus,
  UpdateSavingsGoalInput,
} from "@/features/finance/types/savings";

function mapGoal(row: Tables<"savings_goals">): SavingsGoal {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    icon: row.icon,
    color: row.color as FinanceColor,
    targetDate: row.target_date,
    status: row.status as SavingsGoalStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  throwIfError(error);
  return (data ?? []).map(mapGoal);
}

export async function createSavingsGoal(
  userId: string,
  input: CreateSavingsGoalInput,
): Promise<SavingsGoal> {
  const status: SavingsGoalStatus =
    input.currentAmount >= input.targetAmount ? "completed" : "active";

  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      target_amount: input.targetAmount,
      current_amount: input.currentAmount,
      icon: input.icon,
      color: input.color,
      target_date: input.targetDate ?? null,
      status,
    })
    .select("*")
    .single();

  throwIfError(error);
  return mapGoal(data as Tables<"savings_goals">);
}

export async function updateSavingsGoal(
  goalId: string,
  input: UpdateSavingsGoalInput,
): Promise<SavingsGoal> {
  const patch: TablesUpdate<"savings_goals"> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.targetAmount !== undefined) patch.target_amount = input.targetAmount;
  if (input.currentAmount !== undefined) patch.current_amount = input.currentAmount;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.color !== undefined) patch.color = input.color;
  if (input.targetDate !== undefined) patch.target_date = input.targetDate;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase
    .from("savings_goals")
    .update(patch)
    .eq("id", goalId)
    .select("*")
    .single();

  throwIfError(error);
  return mapGoal(data as Tables<"savings_goals">);
}

/**
 * Add (or, with a negative delta, withdraw) funds. The running balance is
 * clamped to ≥ 0, and the goal auto-completes when the target is reached.
 */
export async function adjustSavingsGoal(
  goal: SavingsGoal,
  delta: number,
): Promise<SavingsGoal> {
  const nextAmount = Math.max(0, Math.round((goal.currentAmount + delta) * 100) / 100);
  const status: SavingsGoalStatus =
    goal.status === "archived"
      ? "archived"
      : nextAmount >= goal.targetAmount
        ? "completed"
        : "active";
  return updateSavingsGoal(goal.id, { currentAmount: nextAmount, status });
}

export async function deleteSavingsGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from("savings_goals").delete().eq("id", goalId);
  throwIfError(error);
}
