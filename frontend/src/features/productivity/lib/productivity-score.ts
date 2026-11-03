// Pure derivation of a single 0–100 "productivity score" from habit and task
// signals. Kept dependency-free and unit-tested, consistent with the app's
// "derive, never store" approach to aggregates.

export interface ProductivityScoreInput {
  /** Share of due habit-days completed over the window (0–100). */
  habitSuccessRate: number;
  /** Share of tasks due in the window that are completed (0–100). */
  taskCompletionRate: number;
  /** Number of habits currently on an active (>0) streak. */
  activeStreaks: number;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Blends habit success (55%) and task completion (45%) into a base out of 90,
 * then adds up to a 10-point bonus for maintaining active streaks. The result
 * is a whole number in the 0–100 range.
 */
export function computeProductivityScore({
  habitSuccessRate,
  taskCompletionRate,
  activeStreaks,
}: ProductivityScoreInput): number {
  const base =
    0.55 * clamp(habitSuccessRate, 0, 100) + 0.45 * clamp(taskCompletionRate, 0, 100);
  const streakBonus = clamp(activeStreaks, 0, 5) * 2;
  return Math.round(clamp(base * 0.9 + streakBonus, 0, 100));
}

export type ScoreBand = "Excellent" | "Strong" | "Fair" | "Getting started";

/** Human-friendly band for a 0–100 score, shared by the profile UI. */
export function scoreBand(score: number): ScoreBand {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Strong";
  if (score >= 35) return "Fair";
  return "Getting started";
}
