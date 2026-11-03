import { useState, type DragEvent } from "react";

import type { CalendarDay } from "@/features/productivity/lib/calendar";
import { WEEKDAY_HEADERS } from "@/features/productivity/lib/calendar";
import type { Task } from "@/features/productivity/types/task";
import { cn } from "@/lib/utils";

interface MonthCalendarProps {
  days: CalendarDay[];
  selectedKey: string | null;
  onSelectDay: (key: string) => void;
  onRescheduleTask: (taskId: string, dayKey: string) => void;
}

const PRIORITY_DOT: Record<Task["priority"], string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const MonthCalendar = ({ days, selectedKey, onSelectDay, onRescheduleTask }: MonthCalendarProps) => {
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const handleDrop = (event: DragEvent<HTMLDivElement>, dayKey: string) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    setDragOverKey(null);
    if (taskId) onRescheduleTask(taskId, dayKey);
  };

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.slice(0, 1)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = day.key === selectedKey;
          const isDragOver = day.key === dragOverKey;
          return (
            <div
              key={day.key}
              role="button"
              tabIndex={0}
              aria-label={day.key}
              onClick={() => onSelectDay(day.key)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectDay(day.key);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverKey(day.key);
              }}
              onDragLeave={() => setDragOverKey((current) => (current === day.key ? null : current))}
              onDrop={(event) => handleDrop(event, day.key)}
              className={cn(
                "flex min-h-[64px] cursor-pointer flex-col gap-1 rounded-xl border p-1.5 text-left transition sm:min-h-[92px]",
                day.inMonth ? "border-border/60 bg-card/40" : "border-transparent bg-transparent opacity-40",
                // Today: tint the whole cell so it reads at a glance, in addition
                // to the circled date number below.
                day.isToday && "border-primary bg-primary/10 ring-1 ring-primary/40",
                isSelected && "border-primary ring-1 ring-primary",
                isDragOver && "border-primary bg-primary/10",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    day.isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                  )}
                >
                  {day.dayOfMonth}
                </span>
                {day.habitsDue.length > 0 && (
                  <span
                    className={cn(
                      "text-[9px] font-semibold",
                      day.isToday
                        ? "rounded-full bg-primary/20 px-1.5 py-0.5 text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {day.completedHabitCount}/{day.habitsDue.length}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {day.tasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/task-id", task.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={(event) => event.stopPropagation()}
                    title={task.title}
                    className="hidden items-center gap-1 rounded bg-secondary px-1 py-0.5 sm:flex"
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[task.priority])} />
                    <span className="truncate text-[10px] font-medium text-foreground">{task.title}</span>
                  </div>
                ))}
                {/* Compact dots for mobile where chips are hidden. */}
                <div className="flex flex-wrap gap-0.5 sm:hidden">
                  {day.tasks.slice(0, 4).map((task) => (
                    <span key={task.id} className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[task.priority])} />
                  ))}
                </div>
                {day.tasks.length > 2 && (
                  <span className="hidden text-[9px] font-semibold text-muted-foreground sm:inline">
                    +{day.tasks.length - 2} more
                  </span>
                )}
                {day.completedTaskCount > 0 && (
                  <span className="mt-auto hidden text-[9px] text-muted-foreground sm:inline">
                    {day.completedTaskCount} done
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendar;
