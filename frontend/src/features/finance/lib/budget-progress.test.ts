import { describe, expect, it } from "vitest";

import { makeTx } from "@/features/finance/lib/__fixtures";
import { computeBudgetProgress } from "@/features/finance/lib/budget-progress";
import type { Budget } from "@/features/finance/types/budget";

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "b1",
    userId: "u1",
    categoryId: "food",
    name: "Food",
    amount: 1000,
    period: "monthly",
    color: "blue",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeBudgetProgress", () => {
  it("sums only the budget's category expenses in the period", () => {
    const progress = computeBudgetProgress(
      makeBudget(),
      [
        makeTx({ type: "expense", amount: 250, categoryId: "food", occurredOn: "2026-07-05" }),
        makeTx({ type: "expense", amount: 150, categoryId: "food", occurredOn: "2026-07-06" }),
        makeTx({ type: "expense", amount: 900, categoryId: "rent", occurredOn: "2026-07-06" }),
        makeTx({ type: "income", amount: 500, categoryId: "food", occurredOn: "2026-07-06" }),
      ],
      "2026-07-10",
    );
    expect(progress.spent).toBe(400);
    expect(progress.remaining).toBe(600);
    expect(progress.percent).toBe(40);
    expect(progress.isOver).toBe(false);
    expect(progress.transactionCount).toBe(2);
  });

  it("flags over-budget and clamps the bar percent at 100", () => {
    const progress = computeBudgetProgress(
      makeBudget({ amount: 200 }),
      [makeTx({ type: "expense", amount: 350, categoryId: "food", occurredOn: "2026-07-05" })],
      "2026-07-10",
    );
    expect(progress.isOver).toBe(true);
    expect(progress.remaining).toBe(-150);
    expect(progress.percent).toBe(100);
  });

  it("an overall budget (null category) counts every expense", () => {
    const progress = computeBudgetProgress(
      makeBudget({ categoryId: null, amount: 1000, name: "Overall" }),
      [
        makeTx({ type: "expense", amount: 300, categoryId: "food", occurredOn: "2026-07-05" }),
        makeTx({ type: "expense", amount: 200, categoryId: "rent", occurredOn: "2026-07-06" }),
      ],
      "2026-07-10",
    );
    expect(progress.spent).toBe(500);
  });

  it("ignores expenses outside the monthly period", () => {
    const progress = computeBudgetProgress(
      makeBudget(),
      [makeTx({ type: "expense", amount: 500, categoryId: "food", occurredOn: "2026-06-30" })],
      "2026-07-10",
    );
    expect(progress.spent).toBe(0);
  });
});
