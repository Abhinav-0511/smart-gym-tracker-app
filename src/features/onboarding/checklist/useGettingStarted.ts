import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  hasMilestone,
  useSetMilestone,
  type MilestoneKey,
} from "@/features/onboarding/milestones";
import {
  MODULE_CHECKLISTS,
  type ChecklistCountSource,
  type ChecklistModuleId,
} from "./checklist-config";

export interface GettingStartedItem {
  key: string;
  label: string;
  done: boolean;
}

export interface GettingStartedState {
  items: GettingStartedItem[];
  completeCount: number;
  total: number;
  allDone: boolean;
  /** True once the module's card should never be shown again. */
  hidden: boolean;
  isLoading: boolean;
}

const COUNT_HEAD = { count: "exact", head: true } as const;

/** Run a head-only COUNT for a named source, scoped to the current user. */
async function runCount(
  source: ChecklistCountSource,
  userId: string,
): Promise<number> {
  let result: { count: number | null; error: unknown };
  switch (source) {
    case "workout_plans":
      result = await supabase.from("workout_plans").select("id", COUNT_HEAD).eq("user_id", userId);
      break;
    case "workout_sessions_any":
      result = await supabase.from("workout_sessions").select("id", COUNT_HEAD).eq("user_id", userId);
      break;
    case "workout_sessions_completed":
      result = await supabase.from("workout_sessions").select("id", COUNT_HEAD).eq("user_id", userId).eq("status", "completed");
      break;
    case "body_weight_entries":
      result = await supabase.from("body_weight_entries").select("id", COUNT_HEAD).eq("user_id", userId);
      break;
    case "habits":
      result = await supabase.from("habits").select("id", COUNT_HEAD).eq("user_id", userId);
      break;
    case "habit_logs_completed":
      result = await supabase.from("habit_logs").select("id", COUNT_HEAD).eq("user_id", userId).eq("completed", true);
      break;
    case "tasks":
      result = await supabase.from("tasks").select("id", COUNT_HEAD).eq("user_id", userId);
      break;
    case "tasks_completed":
      result = await supabase.from("tasks").select("id", COUNT_HEAD).eq("user_id", userId).eq("status", "completed");
      break;
    case "transactions_income":
      result = await supabase.from("transactions").select("id", COUNT_HEAD).eq("user_id", userId).eq("type", "income");
      break;
    case "transactions_expense":
      result = await supabase.from("transactions").select("id", COUNT_HEAD).eq("user_id", userId).eq("type", "expense");
      break;
    case "budgets":
      result = await supabase.from("budgets").select("id", COUNT_HEAD).eq("user_id", userId);
      break;
    default:
      return 0;
  }

  if (result.error) throw result.error;
  return result.count ?? 0;
}

/**
 * Computes a module's Getting-Started progress from real data. Count-based steps
 * are fetched (once, cached, refetched on focus); "view" steps read one-time
 * milestone flags off the profile. When everything is complete it records the
 * module's done-milestone so the card disappears forever.
 *
 * The query is disabled entirely once that done-milestone is set, so a returning
 * user pays no query cost.
 */
export function useGettingStarted(moduleId: ChecklistModuleId): GettingStartedState {
  const { user, profile } = useAuth();
  const setMilestone = useSetMilestone();
  const config = MODULE_CHECKLISTS[moduleId];

  const permanentlyHidden = hasMilestone(profile, config.doneMilestone);

  const countSources = config.items
    .filter((item) => item.detector.kind === "count")
    .map((item) => (item.detector as { source: ChecklistCountSource }).source);

  const { data: counts, isLoading } = useQuery({
    queryKey: ["getting-started", moduleId, user?.id],
    enabled: Boolean(user?.id) && !permanentlyHidden,
    staleTime: 30_000,
    queryFn: async () => {
      const userId = user!.id;
      const entries = await Promise.all(
        countSources.map(async (source) => [source, await runCount(source, userId)] as const),
      );
      return Object.fromEntries(entries) as Record<ChecklistCountSource, number>;
    },
  });

  const items: GettingStartedItem[] = config.items.map((item) => {
    let done = false;
    if (item.detector.kind === "milestone") {
      done = hasMilestone(profile, item.detector.milestone as MilestoneKey);
    } else if (counts) {
      done = (counts[item.detector.source] ?? 0) > 0;
    }
    return { key: item.key, label: item.label, done };
  });

  const completeCount = items.filter((item) => item.done).length;
  const total = items.length;
  const dataReady = !permanentlyHidden && !isLoading && Boolean(counts);
  const allDone = dataReady && completeCount === total;

  // Persist the "done" milestone once, so the card never returns.
  useEffect(() => {
    if (allDone && !permanentlyHidden) {
      void setMilestone(config.doneMilestone);
    }
  }, [allDone, permanentlyHidden, config.doneMilestone, setMilestone]);

  return {
    items,
    completeCount,
    total,
    allDone,
    hidden: permanentlyHidden,
    isLoading: !permanentlyHidden && isLoading,
  };
}
