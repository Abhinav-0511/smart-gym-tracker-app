import { MILESTONE, type MilestoneKey } from "@/features/onboarding/milestones";

/**
 * Getting-Started checklist definitions. Each item's completion is DERIVED from
 * real data (see useGettingStarted) — never a manual toggle — so the list can
 * only ever reflect what the user has actually done. "View" steps that have no
 * data footprint are backed by one-time milestone flags instead.
 */
export type ChecklistModuleId = "fitness" | "productivity" | "finance";

/** How a single step's completion is detected. */
export type ChecklistDetector =
  | { kind: "count"; source: ChecklistCountSource }
  | { kind: "milestone"; milestone: MilestoneKey };

/** Named count queries the hook knows how to run. */
export type ChecklistCountSource =
  | "workout_plans"
  | "workout_sessions_any"
  | "workout_sessions_completed"
  | "body_weight_entries"
  | "habits"
  | "habit_logs_completed"
  | "tasks"
  | "tasks_completed"
  | "transactions_income"
  | "transactions_expense"
  | "budgets";

export interface ChecklistItemDef {
  key: string;
  label: string;
  detector: ChecklistDetector;
}

export interface ModuleChecklist {
  moduleId: ChecklistModuleId;
  /** Milestone set (once) when every item is complete, hiding the card forever. */
  doneMilestone: MilestoneKey;
  items: ChecklistItemDef[];
}

export const MODULE_CHECKLISTS: Record<ChecklistModuleId, ModuleChecklist> = {
  fitness: {
    moduleId: "fitness",
    doneMilestone: MILESTONE.fitnessChecklistDone,
    items: [
      { key: "create_plan", label: "Create a workout plan", detector: { kind: "count", source: "workout_plans" } },
      { key: "start_workout", label: "Start your first workout", detector: { kind: "count", source: "workout_sessions_any" } },
      { key: "complete_workout", label: "Complete your first workout", detector: { kind: "count", source: "workout_sessions_completed" } },
      { key: "log_weight", label: "Log your body weight", detector: { kind: "count", source: "body_weight_entries" } },
      { key: "view_progress", label: "View your progress", detector: { kind: "milestone", milestone: MILESTONE.viewedFitnessProgress } },
    ],
  },
  productivity: {
    moduleId: "productivity",
    doneMilestone: MILESTONE.productivityChecklistDone,
    items: [
      { key: "create_habit", label: "Create a habit", detector: { kind: "count", source: "habits" } },
      { key: "complete_habit", label: "Complete a habit", detector: { kind: "count", source: "habit_logs_completed" } },
      { key: "create_task", label: "Create a task", detector: { kind: "count", source: "tasks" } },
      { key: "complete_task", label: "Complete a task", detector: { kind: "count", source: "tasks_completed" } },
      { key: "view_stats", label: "View your statistics", detector: { kind: "milestone", milestone: MILESTONE.viewedProductivityReports } },
    ],
  },
  finance: {
    moduleId: "finance",
    doneMilestone: MILESTONE.financeChecklistDone,
    items: [
      { key: "add_income", label: "Add income", detector: { kind: "count", source: "transactions_income" } },
      { key: "add_expense", label: "Add an expense", detector: { kind: "count", source: "transactions_expense" } },
      { key: "create_budget", label: "Create a budget", detector: { kind: "count", source: "budgets" } },
      { key: "view_reports", label: "View your reports", detector: { kind: "milestone", milestone: MILESTONE.viewedFinanceReports } },
    ],
  },
};
