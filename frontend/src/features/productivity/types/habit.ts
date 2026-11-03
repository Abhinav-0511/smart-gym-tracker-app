// Domain model for the Habit Tracker. Stored fields mirror the `habits` table;
// streaks and completion rate are derived from habit_logs in the service layer
// (see HabitStats), consistent with how the Fitness modules derive aggregates.

export type HabitCategory =
  | "health"
  | "fitness"
  | "learning"
  | "mindfulness"
  | "productivity"
  | "finance"
  | "social"
  | "creativity"
  | "other";

export type HabitFrequency = "daily" | "weekdays" | "custom";

export type HabitStatus = "active" | "paused" | "archived";

export type HabitColor =
  | "slate"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "pink"
  | "rose"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan";

/** ISO weekday numbers used by `custom` habits (1 = Monday … 7 = Sunday). */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: HabitCategory;
  icon: string;
  color: HabitColor;
  frequency: HabitFrequency;
  customDays: IsoWeekday[] | null;
  targetValue: number | null;
  unit: string | null;
  reminderEnabled: boolean;
  reminderTime: string | null;
  status: HabitStatus;
  createdAt: string;
  updatedAt: string;
}

/** A single day's completion record for a habit. */
export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  logDate: string;
  value: number | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Derived, never stored: computed from a habit's logs and its frequency. */
export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  /** 0–100, share of due days completed over the tracked window. */
  completionRate: number;
  totalCompletions: number;
  completedToday: boolean;
  lastCompletedOn: string | null;
}

export interface HabitWithStats extends Habit {
  stats: HabitStats;
}

export interface CreateHabitInput {
  title: string;
  description?: string | null;
  category: HabitCategory;
  icon: string;
  color: HabitColor;
  frequency: HabitFrequency;
  customDays?: IsoWeekday[] | null;
  targetValue?: number | null;
  unit?: string | null;
  reminderEnabled: boolean;
  reminderTime?: string | null;
}

export type UpdateHabitInput = Partial<CreateHabitInput> & {
  status?: HabitStatus;
};

export const HABIT_CATEGORIES: readonly HabitCategory[] = [
  "health",
  "fitness",
  "learning",
  "mindfulness",
  "productivity",
  "finance",
  "social",
  "creativity",
  "other",
];

export const HABIT_COLORS: readonly HabitColor[] = [
  "slate",
  "blue",
  "indigo",
  "violet",
  "purple",
  "pink",
  "rose",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
];

/** ISO weekday (1 = Monday … 7 = Sunday) for a local date. */
export function getIsoWeekday(date: Date): IsoWeekday {
  const day = date.getDay(); // 0 = Sunday … 6 = Saturday
  return (day === 0 ? 7 : day) as IsoWeekday;
}

/** Whether a habit is scheduled (due) on the given ISO weekday (1–7). */
export function isHabitDueOnWeekday(
  habit: Pick<Habit, "frequency" | "customDays">,
  weekday: IsoWeekday,
): boolean {
  switch (habit.frequency) {
    case "daily":
      return true;
    case "weekdays":
      return weekday >= 1 && weekday <= 5;
    case "custom":
      return habit.customDays?.includes(weekday) ?? false;
    default:
      return false;
  }
}

/** Whether a habit is scheduled (due) on the given local date. */
export function isHabitDueOn(
  habit: Pick<Habit, "frequency" | "customDays">,
  date: Date,
): boolean {
  return isHabitDueOnWeekday(habit, getIsoWeekday(date));
}
