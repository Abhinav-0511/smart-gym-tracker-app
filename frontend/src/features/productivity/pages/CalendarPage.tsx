import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/features/productivity/hooks/useHabits";
import { useTasks } from "@/features/productivity/hooks/useTasks";
import { useUndoConfirm } from "@/features/productivity/hooks/useUndoConfirm";
import MonthCalendar from "@/features/productivity/components/MonthCalendar";
import DayDetailSheet from "@/features/productivity/components/DayDetailSheet";
import TaskFormDialog from "@/features/productivity/components/TaskFormDialog";
import UndoConfirmDialog from "@/features/productivity/components/UndoConfirmDialog";
import {
  buildCalendarGrid,
  formatMonthLabel,
  monthStartKey,
  shiftMonth,
} from "@/features/productivity/lib/calendar";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import type { CreateTaskInput, Task } from "@/features/productivity/types/task";

const CalendarPage = () => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const { toast } = useToast();

  const habits = useHabits(user?.id, timezone, false);
  const tasks = useTasks(user?.id, timezone, false);
  const todayKey = tasks.todayKey;
  const undo = useUndoConfirm(todayKey);

  const [monthKey, setMonthKey] = useState(() => monthStartKey(todayKey));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formDueDate, setFormDueDate] = useState<string | null>(null);

  const habitList = useMemo(() => habits.habitsQuery.data ?? [], [habits.habitsQuery.data]);
  const taskList = useMemo(() => tasks.tasksQuery.data ?? [], [tasks.tasksQuery.data]);
  const isLoading = habits.habitsQuery.isLoading || tasks.tasksQuery.isLoading;

  const days = useMemo(
    () => buildCalendarGrid(monthKey, taskList, habitList, todayKey),
    [monthKey, taskList, habitList, todayKey],
  );

  const selectedDay = useMemo(
    () => days.find((day) => day.key === selectedKey) ?? null,
    [days, selectedKey],
  );

  const openDay = (key: string) => {
    setSelectedKey(key);
    setSheetOpen(true);
  };

  const handleReschedule = (taskId: string, dayKey: string) => {
    tasks.rescheduleMutation.mutate({ taskId, dueDate: dayKey });
  };

  const handleToggleTask = (task: Task) => {
    tasks.statusMutation.mutate({
      taskId: task.id,
      status: task.status === "completed" ? "pending" : "completed",
    });
  };

  const handleToggleHabit = (habit: HabitWithHistory, dateKey: string, complete: boolean) => {
    undo.requestToggle({
      kind: "habit",
      id: habit.id,
      dateKey,
      // complete === false means the habit is currently done for this day, so
      // the click is an undo — confirm it and enforce the one-undo limit.
      isDone: !complete,
      title: habit.title,
      run: () => habits.toggleMutation.mutate({ habit, dateKey, complete }),
    });
  };

  const openAddTask = (dayKey: string) => {
    setEditingTask(null);
    setFormDueDate(dayKey);
    setFormOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setFormDueDate(task.dueDate);
    setFormOpen(true);
  };

  const handleSubmitTask = async (input: CreateTaskInput) => {
    if (editingTask) {
      await tasks.updateMutation.mutateAsync({ taskId: editingTask.id, input });
      toast({ title: "Task updated" });
    } else {
      await tasks.createMutation.mutateAsync(input);
      toast({ title: "Task created" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-foreground">{formatMonthLabel(monthKey)}</h2>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setMonthKey(monthStartKey(todayKey))}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonthKey((current) => shiftMonth(current, -1))}
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonthKey((current) => shiftMonth(current, 1))}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: drag a task chip onto another day to reschedule it.
      </p>

      {isLoading ? (
        <Skeleton className="h-[520px] rounded-2xl" />
      ) : (
        <GlassCard className="p-3 sm:p-4">
          <MonthCalendar
            days={days}
            selectedKey={selectedKey}
            onSelectDay={openDay}
            onRescheduleTask={handleReschedule}
          />
        </GlassCard>
      )}

      <DayDetailSheet
        open={sheetOpen}
        day={selectedDay}
        onOpenChange={setSheetOpen}
        onToggleTask={handleToggleTask}
        onToggleHabit={handleToggleHabit}
        onEditTask={openEditTask}
        onAddTask={openAddTask}
        isHabitLocked={(habitId, dateKey) => undo.isLocked("habit", habitId, dateKey)}
      />

      <UndoConfirmDialog pending={undo.pending} onConfirm={undo.confirm} onCancel={undo.cancel} />

      <TaskFormDialog
        open={formOpen}
        task={editingTask}
        saving={tasks.createMutation.isPending || tasks.updateMutation.isPending}
        defaultDueDate={formDueDate}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmitTask}
      />
    </div>
  );
};

export default CalendarPage;
