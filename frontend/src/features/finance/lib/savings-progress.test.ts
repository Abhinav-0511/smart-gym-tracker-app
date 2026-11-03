import { describe, expect, it } from "vitest";

import { computeSavingsProgress } from "@/features/finance/lib/savings-progress";

describe("computeSavingsProgress", () => {
  it("computes percent, remaining, and days left", () => {
    const progress = computeSavingsProgress(
      { targetAmount: 1000, currentAmount: 250, targetDate: "2026-07-20" },
      "2026-07-10",
    );
    expect(progress.percent).toBe(25);
    expect(progress.remaining).toBe(750);
    expect(progress.isComplete).toBe(false);
    expect(progress.daysRemaining).toBe(10);
  });

  it("clamps a completed goal and drops a past target date", () => {
    const progress = computeSavingsProgress(
      { targetAmount: 1000, currentAmount: 1200, targetDate: "2026-07-01" },
      "2026-07-10",
    );
    expect(progress.percent).toBe(100);
    expect(progress.remaining).toBe(0);
    expect(progress.isComplete).toBe(true);
    expect(progress.daysRemaining).toBeNull();
  });
});
