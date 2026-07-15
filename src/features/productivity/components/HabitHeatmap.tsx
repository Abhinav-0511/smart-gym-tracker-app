import { useMemo } from "react";

import {
  daysInMonthOfKey,
  isoWeekdayOfKey,
  monthStartKey,
  parseDateKey,
} from "@/features/productivity/lib/date-keys";
import { getHabitColorClasses } from "@/features/productivity/lib/habit-colors";
import {
  isHabitDueOnWeekday,
  type Habit,
  type HabitColor,
} from "@/features/productivity/types/habit";
import { cn } from "@/lib/utils";

interface HabitHeatmapProps {
  color: HabitColor;
  frequency: Habit["frequency"];
  customDays: Habit["customDays"];
  completedKeys: string[];
  todayKey: string;
  className?: string;
}

type CellState = "completed" | "missed" | "off" | "future";

interface DayCell {
  key: string;
  day: number;
  state: CellState;
  isToday: boolean;
}

const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * Current-month completion calendar: one cell per day of the month the user is
 * in (28–31 cells), laid out Monday–Sunday with leading blanks so each day sits
 * under its weekday — exactly like a wall calendar. Completed days are filled
 * with the habit colour, due-but-missed days are muted, off days faint, and
 * days still to come are left empty.
 */
const HabitHeatmap = ({
  color,
  frequency,
  customDays,
  completedKeys,
  todayKey,
  className,
}: HabitHeatmapProps) => {
  const solid = getHabitColorClasses(color).solid;

  const { monthLabel, leadingBlanks, cells } = useMemo(() => {
    const completed = new Set(completedKeys);
    const firstKey = monthStartKey(todayKey);
    const totalDays = daysInMonthOfKey(todayKey);
    // Monday-first offset: how many empty slots precede the 1st.
    const blanks = isoWeekdayOfKey(firstKey) - 1;
    const yearMonth = firstKey.slice(0, 7); // "YYYY-MM"

    const dayCells = Array.from({ length: totalDays }, (_, index): DayCell => {
      const day = index + 1;
      const key = `${yearMonth}-${String(day).padStart(2, "0")}`;
      const weekday = isoWeekdayOfKey(key);
      let state: CellState;
      if (key > todayKey) state = "future";
      else if (completed.has(key)) state = "completed";
      else if (isHabitDueOnWeekday({ frequency, customDays }, weekday)) state = "missed";
      else state = "off";
      return { key, day, state, isToday: key === todayKey };
    });

    return {
      monthLabel: parseDateKey(firstKey).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
      leadingBlanks: blanks,
      cells: dayCells,
    };
  }, [completedKeys, todayKey, frequency, customDays]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">{monthLabel}</p>
        <p className="text-[10px] text-muted-foreground">{cells.length} days</p>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_INITIALS.map((label, index) => (
          <span
            key={index}
            aria-hidden
            className="text-center text-[9px] font-semibold uppercase text-muted-foreground/70"
          >
            {label}
          </span>
        ))}
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <span key={`blank-${index}`} aria-hidden />
        ))}
        {cells.map((cell) => (
          <div
            key={cell.key}
            title={`${parseDateKey(cell.key).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}${cell.state === "completed" ? " · done" : cell.state === "missed" ? " · missed" : ""}`}
            className={cn(
              "flex aspect-square items-center justify-center rounded-[5px] text-[9px] font-semibold tabular-nums transition-colors",
              cell.state === "completed" && cn(solid, "text-white"),
              cell.state === "missed" && "bg-muted text-muted-foreground",
              cell.state === "off" && "bg-muted/40 text-muted-foreground/60",
              cell.state === "future" && "text-muted-foreground/40",
              cell.isToday && "ring-2 ring-primary ring-offset-1 ring-offset-card",
            )}
          >
            {cell.day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitHeatmap;
