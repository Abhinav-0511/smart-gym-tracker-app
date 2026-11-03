import type { FinanceColor } from "@/features/finance/types/common";

export interface FinanceColorClasses {
  /** Tinted background for an icon chip. */
  chip: string;
  /** Foreground colour for the icon / accent text. */
  icon: string;
  /** Solid fill for progress bars, swatches, chart marks. */
  solid: string;
  /** Raw hex, for chart libraries that need a string colour. */
  hex: string;
}

// Full class strings are written literally so Tailwind's JIT scanner keeps them.
const FINANCE_COLOR_CLASSES: Record<FinanceColor, FinanceColorClasses> = {
  slate: { chip: "bg-slate-500/15", icon: "text-slate-600 dark:text-slate-300", solid: "bg-slate-500", hex: "#64748b" },
  blue: { chip: "bg-blue-500/15", icon: "text-blue-600 dark:text-blue-400", solid: "bg-blue-500", hex: "#3b82f6" },
  indigo: { chip: "bg-indigo-500/15", icon: "text-indigo-600 dark:text-indigo-400", solid: "bg-indigo-500", hex: "#6366f1" },
  violet: { chip: "bg-violet-500/15", icon: "text-violet-600 dark:text-violet-400", solid: "bg-violet-500", hex: "#8b5cf6" },
  purple: { chip: "bg-purple-500/15", icon: "text-purple-600 dark:text-purple-400", solid: "bg-purple-500", hex: "#a855f7" },
  pink: { chip: "bg-pink-500/15", icon: "text-pink-600 dark:text-pink-400", solid: "bg-pink-500", hex: "#ec4899" },
  rose: { chip: "bg-rose-500/15", icon: "text-rose-600 dark:text-rose-400", solid: "bg-rose-500", hex: "#f43f5e" },
  red: { chip: "bg-red-500/15", icon: "text-red-600 dark:text-red-400", solid: "bg-red-500", hex: "#ef4444" },
  orange: { chip: "bg-orange-500/15", icon: "text-orange-600 dark:text-orange-400", solid: "bg-orange-500", hex: "#f97316" },
  amber: { chip: "bg-amber-500/15", icon: "text-amber-600 dark:text-amber-400", solid: "bg-amber-500", hex: "#f59e0b" },
  yellow: { chip: "bg-yellow-500/15", icon: "text-yellow-600 dark:text-yellow-400", solid: "bg-yellow-500", hex: "#eab308" },
  lime: { chip: "bg-lime-500/15", icon: "text-lime-600 dark:text-lime-400", solid: "bg-lime-500", hex: "#84cc16" },
  green: { chip: "bg-green-500/15", icon: "text-green-600 dark:text-green-400", solid: "bg-green-500", hex: "#22c55e" },
  emerald: { chip: "bg-emerald-500/15", icon: "text-emerald-600 dark:text-emerald-400", solid: "bg-emerald-500", hex: "#10b981" },
  teal: { chip: "bg-teal-500/15", icon: "text-teal-600 dark:text-teal-400", solid: "bg-teal-500", hex: "#14b8a6" },
  cyan: { chip: "bg-cyan-500/15", icon: "text-cyan-600 dark:text-cyan-400", solid: "bg-cyan-500", hex: "#06b6d4" },
};

export function getFinanceColorClasses(color: FinanceColor): FinanceColorClasses {
  return FINANCE_COLOR_CLASSES[color] ?? FINANCE_COLOR_CLASSES.blue;
}

export function getFinanceColorHex(color: FinanceColor): string {
  return getFinanceColorClasses(color).hex;
}
