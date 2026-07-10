import { format } from "date-fns";
import { Check, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CalendarDay } from "@/features/productivity/lib/calendar";
import { getHabitColorClasses } from "@/features/productivity/lib/habit-colors";
import { getHabitIcon } from "@/features/productivity/lib/habit-icons";
import { parseDateKey } from "@/features/productivity/lib/date-keys";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import type { Task } from "@/features/productivity/types/task";
import { cn } from "@/lib/utils";

interface DayDetailSheetProps {
  open: boolean;
  day: CalendarDay | null;
  onOpenChange: (open: boolean) => void;
  onToggleTask: (task: Task) => void;
  onToggleHabit: (habit: HabitWithHistory, dateKey: string, complete: boolean) => void;
  onEditTask: (task: Task) => void;
  onAddTask: (dayKey: string) => void;
}

const DayDetailSheet = ({
  open,
  day,
  onOpenChange,
  onToggleTask,
  onToggleHabit,
  onEditTask,
  onAddTask,
}: DayDetailSheetProps) => {
  const title = day ? format(parseDateKey(day.key), "EEEE, MMMM d") : "";
  const hasContent = day && (day.tasks.length > 0 || day.habitsDue.length > 0 || day.completedTaskCount > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Tasks and habits for this day.</SheetDescription>
        </SheetHeader>

        {day && (
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tasks</h4>
                <Button size="sm" variant="outline" onClick={() => onAddTask(day.key)}>
                  <Plus size={14} /> Add
                </Button>
              </div>
              {day.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending tasks.</p>
              ) : (
                <ul className="space-y-1.5">
                  {day.tasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-2.5 rounded-lg bg-secondary/40 p-2">
                      <button
                        type="button"
                        aria-label="Complete task"
                        onClick={() => onToggleTask(task)}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border text-transparent transition hover:border-primary"
                      >
                        <Check size={12} strokeWidth={3} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground hover:underline"
                      >
                        {task.title}
                      </button>
                      <span className="shrink-0 text-xs capitalize text-muted-foreground">{task.priority}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Habits</h4>
              {day.habitsDue.length === 0 ? (
                <p className="text-sm text-muted-foreground">No habits scheduled.</p>
              ) : (
                <ul className="space-y-1.5">
                  {day.habitsDue.map((habit) => {
                    const colors = getHabitColorClasses(habit.color);
                    const Icon = getHabitIcon(habit.icon);
                    const done = habit.recentCompletedKeys.includes(day.key);
                    return (
                      <li key={habit.id} className="flex items-center gap-2.5 rounded-lg bg-secondary/40 p-2">
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", colors.chip)}>
                          <Icon size={16} className={colors.icon} />
                        </div>
                        <span className={cn("min-w-0 flex-1 truncate text-sm font-medium text-foreground", done && "line-through opacity-60")}>
                          {habit.title}
                        </span>
                        <button
                          type="button"
                          aria-label={done ? "Mark not done" : "Mark done"}
                          aria-pressed={done}
                          onClick={() => onToggleHabit(habit, day.key, !done)}
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition",
                            done
                              ? cn(colors.solid, "border-transparent text-white")
                              : "border-border text-muted-foreground hover:border-primary",
                          )}
                        >
                          <Check size={14} strokeWidth={done ? 3 : 2} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {day.completedTaskCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {day.completedTaskCount} completed task{day.completedTaskCount === 1 ? "" : "s"} on this day.
              </p>
            )}

            {!hasContent && (
              <p className="text-sm text-muted-foreground">Nothing scheduled. Add a task to get started.</p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DayDetailSheet;
