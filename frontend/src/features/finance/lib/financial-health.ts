// Pure derivation of a single 0–100 "financial health score" from a month's
// income/expense summary and budget adherence. No network, fully unit-tested.

export interface FinancialHealthInput {
  /** Month income total. */
  income: number;
  /** Month expense total. */
  expense: number;
  /** 0–100 share of income kept (see computeMonthSummary.savingsRate). */
  savingsRate: number;
  /** Number of budgets currently over their limit. */
  budgetsOver: number;
  /** Total number of active budgets. */
  budgetsTotal: number;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Combines savings rate (60%) with budget adherence (40%). When no budgets
 * exist, adherence is treated as a neutral 70 so unbudgeted-but-solvent users
 * are not unfairly penalised. Returns a whole number in 0–100. A month with
 * spending but no income scores 0 (living entirely on reserves/credit).
 */
export function computeFinancialHealthScore({
  income,
  expense,
  savingsRate,
  budgetsOver,
  budgetsTotal,
}: FinancialHealthInput): number {
  if (income <= 0) {
    return expense > 0 ? 0 : 0;
  }

  const savingsComponent = clamp(savingsRate, 0, 100);
  const adherence =
    budgetsTotal > 0
      ? clamp(((budgetsTotal - budgetsOver) / budgetsTotal) * 100, 0, 100)
      : 70;

  return Math.round(clamp(0.6 * savingsComponent + 0.4 * adherence, 0, 100));
}

export type HealthBand = "Excellent" | "Healthy" | "Watch" | "At risk";

/** Human-friendly band for a 0–100 financial-health score. */
export function healthBand(score: number): HealthBand {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Healthy";
  if (score >= 35) return "Watch";
  return "At risk";
}
