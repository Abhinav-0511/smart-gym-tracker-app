import { useCallback } from "react";

import { useAuth } from "@/hooks/useAuth";
import type { Profile } from "@/services/profiles";

/**
 * One-time milestone flags persisted in `profiles.milestones` (a jsonb map of
 * string -> true). Used for "view X" checklist steps and the per-module
 * "checklist done" markers — anything that can't be derived from feature data
 * alone. Writes are idempotent: a flag is only ever set once.
 */
export type Milestones = Record<string, boolean>;

/** Milestone keys used across the app. Keep in one place to avoid typos. */
export const MILESTONE = {
  viewedFitnessProgress: "viewed_fitness_progress",
  viewedProductivityReports: "viewed_productivity_reports",
  viewedFinanceReports: "viewed_finance_reports",
  fitnessChecklistDone: "fitness_checklist_done",
  productivityChecklistDone: "productivity_checklist_done",
  financeChecklistDone: "finance_checklist_done",
} as const;

export type MilestoneKey = (typeof MILESTONE)[keyof typeof MILESTONE];

/** Safely read the milestones map off a profile (tolerates null / bad shapes). */
export function readMilestones(profile: Profile | null): Milestones {
  const raw = profile?.milestones;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Milestones;
  }
  return {};
}

export function hasMilestone(profile: Profile | null, key: MilestoneKey): boolean {
  return readMilestones(profile)[key] === true;
}

/**
 * Returns a stable setter that flips a milestone flag on and persists it. It is
 * a no-op when the flag is already set, so it is safe to call on every mount /
 * render (e.g. marking a "view reports" milestone).
 */
export function useSetMilestone() {
  const { profile, updateProfile } = useAuth();

  return useCallback(
    async (key: MilestoneKey) => {
      if (!profile || hasMilestone(profile, key)) {
        return;
      }
      const next = { ...readMilestones(profile), [key]: true };
      try {
        await updateProfile({ milestones: next });
      } catch {
        // Best-effort: a failed milestone write must never break the page.
      }
    },
    [profile, updateProfile],
  );
}
