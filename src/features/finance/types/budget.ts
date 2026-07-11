import type { FinanceColor } from "@/features/finance/types/common";

export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export const BUDGET_PERIODS: readonly BudgetPeriod[] = ["weekly", "monthly", "yearly"];

export const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export interface Budget {
  id: string;
  userId: string;
  /** NULL => an overall budget across every expense category. */
  categoryId: string | null;
  name: string;
  amount: number;
  period: BudgetPeriod;
  color: FinanceColor;
  createdAt: string;
  updatedAt: string;
}

/** Derived, never stored: a budget's spend for the active period. */
export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  /** 0–100+ (can exceed 100 when over budget). */
  percent: number;
  isOver: boolean;
  transactionCount: number;
}

export interface CreateBudgetInput {
  categoryId: string | null;
  name: string;
  amount: number;
  period: BudgetPeriod;
  color: FinanceColor;
}

export type UpdateBudgetInput = Partial<CreateBudgetInput>;
