import { describe, expect, it } from "vitest";

import { makeTx } from "@/features/finance/lib/__fixtures";
import { buildFinanceReport } from "@/features/finance/lib/analytics";

describe("buildFinanceReport", () => {
  it("derives extremes, averages, and payment-method usage", () => {
    const report = buildFinanceReport({
      transactions: [
        makeTx({ type: "income", amount: 2000, title: "Salary", occurredOn: "2026-07-01", paymentMethod: "bank_transfer" }),
        makeTx({ type: "expense", amount: 800, title: "Rent", occurredOn: "2026-07-02", paymentMethod: "upi", categoryId: "rent" }),
        makeTx({ type: "expense", amount: 200, title: "Food", occurredOn: "2026-07-02", paymentMethod: "upi", categoryId: "food" }),
      ],
      monthKey: "2026-07",
    });

    expect(report.largestExpense?.title).toBe("Rent");
    expect(report.highestIncome?.title).toBe("Salary");
    expect(report.expense).toBe(1000);
    expect(report.avgTransactionValue).toBe(500); // 1000 / 2 expense txns
    expect(report.mostUsedPaymentMethod?.method).toBe("upi");
    expect(report.mostExpensiveDay).toEqual({ dateKey: "2026-07-02", amount: 1000 });
  });

  it("computes month-over-month change and a trailing trend", () => {
    const report = buildFinanceReport({
      transactions: [
        makeTx({ type: "expense", amount: 100, occurredOn: "2026-06-10" }),
        makeTx({ type: "expense", amount: 150, occurredOn: "2026-07-10" }),
      ],
      monthKey: "2026-07",
      trailingMonths: 3,
    });

    expect(report.prevExpense).toBe(100);
    expect(report.expenseChangePct).toBe(50); // 100 -> 150
    expect(report.trend).toHaveLength(3);
    expect(report.trend.at(-1)?.monthKey).toBe("2026-07");
  });

  it("returns null comparisons and extremes with no data", () => {
    const report = buildFinanceReport({ transactions: [], monthKey: "2026-07" });
    expect(report.largestExpense).toBeNull();
    expect(report.mostUsedPaymentMethod).toBeNull();
    expect(report.expenseChangePct).toBeNull();
    expect(report.avgTransactionValue).toBe(0);
  });
});
