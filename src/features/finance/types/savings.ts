import type { FinanceColor } from "@/features/finance/types/common";

export type SavingsGoalStatus = "active" | "completed" | "archived";

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: FinanceColor;
  targetDate: string | null;
  status: SavingsGoalStatus;
  createdAt: string;
  updatedAt: string;
}

/** Derived progress for a savings goal. */
export interface SavingsGoalProgress {
  remaining: number;
  /** 0–100, clamped. */
  percent: number;
  isComplete: boolean;
  /** Whole days until target date, or null when none / already past. */
  daysRemaining: number | null;
}

export interface CreateSavingsGoalInput {
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: FinanceColor;
  targetDate?: string | null;
}

export type UpdateSavingsGoalInput = Partial<CreateSavingsGoalInput> & {
  status?: SavingsGoalStatus;
};
