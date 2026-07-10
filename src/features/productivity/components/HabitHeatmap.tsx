import { useMemo } from "react";

import { addDays, isoWeekdayOfKey, parseDateKey } from "@/features/productivity/lib/date-keys";
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
  /** Number of week columns to render. */
  weeks?: number;
  className?: string;
}

type CellState = "completed" | "missed" | "off" | "future";

/** GitHub-style completion grid: one column per week, one cell per day. */
const HabitHeatmap = ({
  color,
  frequency,
  customDays,
  completedKeys,
  todayKey,
  weeks = 17,
  className,
}: HabitHeatmapProps) => {
  const solid = getHabitColorClasses(color).solid;

  const columns = useMemo(() => {
    const completed = new Set(completedKeys);
    // Snap the window start back to the most recent Monday.
    let start = addDays(todayKey, -(weeks * 7 - 1));
    while (isoWeekdayOfKey(start) !== 1) start = addDays(start, -1);

    return Array.from({ length: weeks }, (_, week) =>
      Array.from({ length: 7 }, (_, day): { key: string; state: CellState } => {
        const key = addDays(start, week * 7 + day);
        const weekday = isoWeekdayOfKey(key);
        let state: CellState;
        if (key > todayKey) state = "future";
        else if (completed.has(key)) state = "completed";
        else if (isHabitDueOnWeekday({ frequency, customDays }, weekday)) state = "missed";
        else state = "off";
        return { key, state };
      }),
    );
  }, [completedKeys, todayKey, weeks, frequency, customDays]);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex gap-1">
        {columns.map((column, index) => (
          <div key={index} className="flex flex-col gap-1">
            {column.map((cell) => (
              <div
                key={cell.key}
                title={
                  cell.state === "future"
                    ? undefined
                    : `${parseDateKey(cell.key).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}${cell.state === "completed" ? " · done" : ""}`
                }
                className={cn(
                  "h-2.5 w-2.5 rounded-[3px]",
                  cell.state === "completed" && solid,
                  cell.state === "missed" && "bg-muted",
                  cell.state === "off" && "bg-muted/40",
                  cell.state === "future" && "bg-transparent",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitHeatmap;
