// Derived savings-goal progress: percent complete, remaining, and days left.

import { clampPercent } from "@/features/finance/lib/money";
import { parseDateKey } from "@/features/finance/lib/dates";
import type { SavingsGoal, SavingsGoalProgress } from "@/features/finance/types/savings";

export function computeSavingsProgress(
  goal: Pick<SavingsGoal, "targetAmount" | "currentAmount" | "targetDate">,
  todayKey: string,
): SavingsGoalProgress {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const percent =
    goal.targetAmount > 0 ? clampPercent((goal.currentAmount / goal.targetAmount) * 100) : 0;

  let daysRemaining: number | null = null;
  if (goal.targetDate) {
    const diffMs = parseDateKey(goal.targetDate).getTime() - parseDateKey(todayKey).getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    daysRemaining = days >= 0 ? days : null;
  }

  return {
    remaining,
    percent,
    isComplete: goal.currentAmount >= goal.targetAmount,
    daysRemaining,
  };
}
