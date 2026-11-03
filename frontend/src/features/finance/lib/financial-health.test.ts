import { describe, expect, it } from "vitest";

import {
  computeFinancialHealthScore,
  healthBand,
} from "@/features/finance/lib/financial-health";

describe("computeFinancialHealthScore", () => {
  it("returns 0 when there is no income", () => {
    expect(
      computeFinancialHealthScore({
        income: 0,
        expense: 5000,
        savingsRate: 0,
        budgetsOver: 0,
        budgetsTotal: 0,
      }),
    ).toBe(0);
  });

  it("treats a budget-free but high-saving month as strong", () => {
    // 0.6*80 + 0.4*70 (neutral adherence) = 48 + 28 = 76
    expect(
      computeFinancialHealthScore({
        income: 10000,
        expense: 2000,
        savingsRate: 80,
        budgetsOver: 0,
        budgetsTotal: 0,
      }),
    ).toBe(76);
  });

  it("rewards keeping every budget in check", () => {
    // 0.6*50 + 0.4*100 = 30 + 40 = 70
    expect(
      computeFinancialHealthScore({
        income: 10000,
        expense: 5000,
        savingsRate: 50,
        budgetsOver: 0,
        budgetsTotal: 4,
      }),
    ).toBe(70);
  });

  it("penalises overspent budgets", () => {
    // 0.6*50 + 0.4*(2/4*100=50) = 30 + 20 = 50
    expect(
      computeFinancialHealthScore({
        income: 10000,
        expense: 5000,
        savingsRate: 50,
        budgetsOver: 2,
        budgetsTotal: 4,
      }),
    ).toBe(50);
  });

  it("clamps to the 0–100 range", () => {
    expect(
      computeFinancialHealthScore({
        income: 10000,
        expense: 0,
        savingsRate: 100,
        budgetsOver: 0,
        budgetsTotal: 2,
      }),
    ).toBe(100);
  });
});

describe("healthBand", () => {
  it("labels scores by band", () => {
    expect(healthBand(85)).toBe("Excellent");
    expect(healthBand(65)).toBe("Healthy");
    expect(healthBand(40)).toBe("Watch");
    expect(healthBand(10)).toBe("At risk");
  });
});
