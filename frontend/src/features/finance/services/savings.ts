import { supabase } from "@/lib/supabase";
import type { Tables, TablesUpdate } from "@/types/database";
import { throwIfError } from "@/features/finance/services/errors";
import type { LocalRow } from "@/offline/db";
import {
  localDelete,
  localInsert,
  localRowsByUser,
  localUpdate,
  pullMirror,
} from "@/offline/repository";
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

async function fetchServerGoalRows(userId: string): Promise<LocalRow[]> {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId);
  throwIfError(error);
  return (data ?? []) as unknown as LocalRow[];
}

export async function fetchSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  await pullMirror("savings_goals", () => fetchServerGoalRows(userId));

  const rows = await localRowsByUser("savings_goals", userId);
  rows.sort((a, b) =>
    ((b.created_at as string) ?? "").localeCompare((a.created_at as string) ?? ""),
  );
  return rows.map((row) => mapGoal(row as unknown as Tables<"savings_goals">));
}

export async function createSavingsGoal(
  userId: string,
  input: CreateSavingsGoalInput,
): Promise<SavingsGoal> {
  const status: SavingsGoalStatus =
    input.currentAmount >= input.targetAmount ? "completed" : "active";

  const row = await localInsert(
    "savings_goals",
    {
      user_id: userId,
      name: input.name.trim(),
      target_amount: input.targetAmount,
      current_amount: input.currentAmount,
      icon: input.icon,
      color: input.color,
      target_date: input.targetDate ?? null,
      status,
    },
    userId,
  );
  return mapGoal(row as unknown as Tables<"savings_goals">);
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

  const row = await localUpdate("savings_goals", goalId, patch);
  return mapGoal(row as unknown as Tables<"savings_goals">);
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
  await localDelete("savings_goals", goalId);
}
