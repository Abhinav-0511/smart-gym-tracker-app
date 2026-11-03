import { describe, expect, it } from "vitest";

import { makeTx } from "@/features/finance/lib/__fixtures";
import {
  computeMonthSummary,
  computeRecentTotals,
} from "@/features/finance/lib/finance-summary";

describe("computeMonthSummary", () => {
  it("totals income and expense and derives net + savings rate", () => {
    const summary = computeMonthSummary(
      [
        makeTx({ type: "income", amount: 1000, occurredOn: "2026-07-01", categoryId: "salary" }),
        makeTx({ type: "expense", amount: 300, occurredOn: "2026-07-05", categoryId: "food" }),
        makeTx({ type: "expense", amount: 100, occurredOn: "2026-07-05", categoryId: "food" }),
      ],
      "2026-07",
    );

    expect(summary.income).toBe(1000);
    expect(summary.expense).toBe(400);
    expect(summary.net).toBe(600);
    expect(summary.savings).toBe(600);
    expect(summary.savingsRate).toBe(60);
    expect(summary.transactionCount).toBe(3);
  });

  it("excludes transactions outside the month", () => {
    const summary = computeMonthSummary(
      [
        makeTx({ type: "expense", amount: 500, occurredOn: "2026-06-30" }),
        makeTx({ type: "expense", amount: 200, occurredOn: "2026-07-15" }),
      ],
      "2026-07",
    );
    expect(summary.expense).toBe(200);
  });

  it("ranks expense categories by amount and zero-fills the daily series", () => {
    const summary = computeMonthSummary(
      [
        makeTx({ type: "expense", amount: 100, categoryId: "a", occurredOn: "2026-07-02" }),
        makeTx({ type: "expense", amount: 400, categoryId: "b", occurredOn: "2026-07-03" }),
      ],
      "2026-07",
    );
    expect(summary.topExpenseCategories[0]).toMatchObject({ categoryId: "b", amount: 400 });
    expect(summary.daily).toHaveLength(31);
    expect(summary.daily[1]).toMatchObject({ label: "2", expense: 100 });
  });

  it("reports a zero savings rate with no income", () => {
    const summary = computeMonthSummary(
      [makeTx({ type: "expense", amount: 100, occurredOn: "2026-07-01" })],
      "2026-07",
    );
    expect(summary.savingsRate).toBe(0);
    expect(summary.net).toBe(-100);
    expect(summary.savings).toBe(0);
  });
});

describe("computeRecentTotals", () => {
  it("sums income and expense within an inclusive date window", () => {
    const totals = computeRecentTotals(
      [
        makeTx({ type: "income", amount: 500, occurredOn: "2026-07-08" }),
        makeTx({ type: "expense", amount: 200, occurredOn: "2026-07-10" }),
        makeTx({ type: "expense", amount: 999, occurredOn: "2026-07-01" }),
      ],
      "2026-07-05",
      "2026-07-10",
    );
    expect(totals).toEqual({ income: 500, expense: 200, net: 300 });
  });
});
