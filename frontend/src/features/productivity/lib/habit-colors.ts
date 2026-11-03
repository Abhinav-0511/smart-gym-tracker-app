import type { HabitColor } from "@/features/productivity/types/habit";

export interface HabitColorClasses {
  /** Tinted background for the habit's icon chip. */
  chip: string;
  /** Foreground colour for the icon / accent text. */
  icon: string;
  /** Solid fill for completed heatmap cells and progress accents. */
  solid: string;
}

// Full class strings are written literally so Tailwind's JIT scanner keeps them.
const HABIT_COLOR_CLASSES: Record<HabitColor, HabitColorClasses> = {
  slate: { chip: "bg-slate-500/15", icon: "text-slate-600 dark:text-slate-300", solid: "bg-slate-500" },
  blue: { chip: "bg-blue-500/15", icon: "text-blue-600 dark:text-blue-400", solid: "bg-blue-500" },
  indigo: { chip: "bg-indigo-500/15", icon: "text-indigo-600 dark:text-indigo-400", solid: "bg-indigo-500" },
  violet: { chip: "bg-violet-500/15", icon: "text-violet-600 dark:text-violet-400", solid: "bg-violet-500" },
  purple: { chip: "bg-purple-500/15", icon: "text-purple-600 dark:text-purple-400", solid: "bg-purple-500" },
  pink: { chip: "bg-pink-500/15", icon: "text-pink-600 dark:text-pink-400", solid: "bg-pink-500" },
  rose: { chip: "bg-rose-500/15", icon: "text-rose-600 dark:text-rose-400", solid: "bg-rose-500" },
  red: { chip: "bg-red-500/15", icon: "text-red-600 dark:text-red-400", solid: "bg-red-500" },
  orange: { chip: "bg-orange-500/15", icon: "text-orange-600 dark:text-orange-400", solid: "bg-orange-500" },
  amber: { chip: "bg-amber-500/15", icon: "text-amber-600 dark:text-amber-400", solid: "bg-amber-500" },
  yellow: { chip: "bg-yellow-500/15", icon: "text-yellow-600 dark:text-yellow-400", solid: "bg-yellow-500" },
  lime: { chip: "bg-lime-500/15", icon: "text-lime-600 dark:text-lime-400", solid: "bg-lime-500" },
  green: { chip: "bg-green-500/15", icon: "text-green-600 dark:text-green-400", solid: "bg-green-500" },
  emerald: { chip: "bg-emerald-500/15", icon: "text-emerald-600 dark:text-emerald-400", solid: "bg-emerald-500" },
  teal: { chip: "bg-teal-500/15", icon: "text-teal-600 dark:text-teal-400", solid: "bg-teal-500" },
  cyan: { chip: "bg-cyan-500/15", icon: "text-cyan-600 dark:text-cyan-400", solid: "bg-cyan-500" },
};

export function getHabitColorClasses(color: HabitColor): HabitColorClasses {
  return HABIT_COLOR_CLASSES[color] ?? HABIT_COLOR_CLASSES.blue;
}
