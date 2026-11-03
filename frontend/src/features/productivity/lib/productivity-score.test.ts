import { describe, expect, it } from "vitest";

import {
  computeProductivityScore,
  scoreBand,
} from "@/features/productivity/lib/productivity-score";

describe("computeProductivityScore", () => {
  it("returns 0 when nothing has been done", () => {
    expect(
      computeProductivityScore({
        habitSuccessRate: 0,
        taskCompletionRate: 0,
        activeStreaks: 0,
      }),
    ).toBe(0);
  });

  it("reaches 100 for perfect rates with sustained streaks", () => {
    expect(
      computeProductivityScore({
        habitSuccessRate: 100,
        taskCompletionRate: 100,
        activeStreaks: 5,
      }),
    ).toBe(100);
  });

  it("caps the streak bonus at five streaks", () => {
    const five = computeProductivityScore({
      habitSuccessRate: 50,
      taskCompletionRate: 50,
      activeStreaks: 5,
    });
    const twenty = computeProductivityScore({
      habitSuccessRate: 50,
      taskCompletionRate: 50,
      activeStreaks: 20,
    });
    expect(five).toBe(twenty);
  });

  it("weights habits slightly more than tasks", () => {
    const habitHeavy = computeProductivityScore({
      habitSuccessRate: 100,
      taskCompletionRate: 0,
      activeStreaks: 0,
    });
    const taskHeavy = computeProductivityScore({
      habitSuccessRate: 0,
      taskCompletionRate: 100,
      activeStreaks: 0,
    });
    expect(habitHeavy).toBeGreaterThan(taskHeavy);
  });

  it("clamps out-of-range inputs", () => {
    expect(
      computeProductivityScore({
        habitSuccessRate: 250,
        taskCompletionRate: -40,
        activeStreaks: -3,
      }),
    ).toBe(Math.round(0.55 * 100 * 0.9));
  });
});

describe("scoreBand", () => {
  it("labels scores by band", () => {
    expect(scoreBand(90)).toBe("Excellent");
    expect(scoreBand(65)).toBe("Strong");
    expect(scoreBand(40)).toBe("Fair");
    expect(scoreBand(10)).toBe("Getting started");
  });
});
