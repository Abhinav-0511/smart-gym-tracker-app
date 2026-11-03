// Derived budget progress: how much of each budget has been spent within its
// active period. Never stored — recomputed from transactions on every read.

import { periodRange } from "@/features/finance/lib/dates";
import { clampPercent } from "@/features/finance/lib/money";
import type { Budget, BudgetProgress } from "@/features/finance/types/budget";
import type { Transaction } from "@/features/finance/types/transaction";

/**
 * Compute a single budget's progress for the period containing `refDateKey`.
 * A budget with a null category tracks all expenses; otherwise only its
 * category's expenses count.
 */
export function computeBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
  refDateKey: string,
): BudgetProgress {
  const { start, end } = periodRange(budget.period, refDateKey);

  let spent = 0;
  let transactionCount = 0;
  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    if (tx.occurredOn < start || tx.occurredOn > end) continue;
    if (budget.categoryId !== null && tx.categoryId !== budget.categoryId) continue;
    spent += tx.amount;
    transactionCount += 1;
  }

  const remaining = budget.amount - spent;
  const percent = budget.amount > 0 ? clampPercent((spent / budget.amount) * 100) : 0;

  return {
    budget,
    spent,
    remaining,
    // percent is clamped for the bar; raw over-budget is signalled by isOver.
    percent,
    isOver: spent > budget.amount,
    transactionCount,
  };
}

/** Compute progress for every budget, sorted by usage (most-used first). */
export function computeAllBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  refDateKey: string,
): BudgetProgress[] {
  return budgets
    .map((budget) => computeBudgetProgress(budget, transactions, refDateKey))
    .sort((a, b) => {
      const aUsed = a.budget.amount > 0 ? a.spent / a.budget.amount : 0;
      const bUsed = b.budget.amount > 0 ? b.spent / b.budget.amount : 0;
      return bUsed - aUsed;
    });
}
