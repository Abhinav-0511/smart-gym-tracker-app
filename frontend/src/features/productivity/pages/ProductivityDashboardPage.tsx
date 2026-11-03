import { useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckSquare,
  Flame,
  ListTodo,
  Lock,
  Plus,
  Quote as QuoteIcon,
  Sparkles,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import GettingStartedCard from "@/features/onboarding/checklist/GettingStartedCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getGreeting } from "@/types/dashboard";
import { useProductivityDashboard } from "@/features/productivity/hooks/useProductivityDashboard";
import { useUndoConfirm } from "@/features/productivity/hooks/useUndoConfirm";
import CompletionRing from "@/features/productivity/components/CompletionRing";
import HabitFormDialog from "@/features/productivity/components/HabitFormDialog";
import TaskFormDialog from "@/features/productivity/components/TaskFormDialog";
import UndoConfirmDialog from "@/features/productivity/components/UndoConfirmDialog";
import { getHabitColorClasses } from "@/features/productivity/lib/habit-colors";
import { getHabitIcon } from "@/features/productivity/lib/habit-icons";
import { getDailyQuote } from "@/features/productivity/lib/quotes";
import { parseDateKey } from "@/features/productivity/lib/date-keys";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import type { CreateHabitInput } from "@/features/productivity/types/habit";
import type { CreateTaskInput, Task } from "@/features/productivity/types/task";
import { cn } from "@/lib/utils";

interface ProductivityDashboardPageProps {
  onNavigate: (page: string) => void;
}

const ProductivityDashboardPage = ({ onNavigate }: ProductivityDashboardPageProps) => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const { toast } = useToast();
  const dashboard = useProductivityDashboard(user?.id, timezone);

  const [habitFormOpen, setHabitFormOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);

  const undo = useUndoConfirm(dashboard.todayKey);

  const handleTaskClick = (task: Task) => {
    undo.requestToggle({
      kind: "task",
      id: task.id,
      dateKey: dashboard.todayKey,
      isDone: task.status === "completed",
      title: task.title,
      run: () => dashboard.toggleTask(task),
    });
  };

  const handleHabitClick = (habit: HabitWithHistory) => {
    const done = habit.stats.completedToday;
    undo.requestToggle({
      kind: "habit",
      id: habit.id,
      dateKey: dashboard.todayKey,
      isDone: done,
      title: habit.title,
      run: () => dashboard.toggleHabit(habit, !done),
    });
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const greeting = getGreeting(new Date(), timezone);
  const todayLabel = format(parseDateKey(dashboard.todayKey), "EEEE, MMMM d");
  const quote = getDailyQuote(dashboard.todayKey);

  const handleCreateHabit = async (input: CreateHabitInput) => {
    await dashboard.habitCreateMutation.mutateAsync(input);
    toast({ title: "Habit created" });
  };

  const handleCreateTask = async (input: CreateTaskInput) => {
    await dashboard.taskCreateMutation.mutateAsync(input);
    toast({ title: "Task created" });
  };

  if (dashboard.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (dashboard.isError) {
    return (
      <GlassCard className="text-center">
        <p className="text-sm text-destructive">Couldn’t load your dashboard.</p>
        <Button variant="outline" className="mt-3" onClick={dashboard.refetch}>
          Retry
        </Button>
      </GlassCard>
    );
  }

  const { habitStats, taskStats } = dashboard;

  return (
    <div className="space-y-6">
      <GettingStartedCard moduleId="productivity" />

      {/* Greeting + quick add */}
      <GlassCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{todayLabel}</p>
            <h2 className="text-lg font-extrabold text-foreground md:text-xl">
              {greeting}, {firstName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {habitStats.remaining === 0 && dashboard.tasksToday.length === 0
                ? "You’re all caught up. Nice work!"
                : `${habitStats.remaining} habit${habitStats.remaining === 1 ? "" : "s"} and ${dashboard.tasksToday.length} task${dashboard.tasksToday.length === 1 ? "" : "s"} left today.`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setHabitFormOpen(true)} className="flex-1 sm:flex-none">
            <Plus size={16} /> Habit
          </Button>
          <Button onClick={() => setTaskFormOpen(true)} className="flex-1 sm:flex-none">
            <Plus size={16} /> Task
          </Button>
        </div>
      </GlassCard>

      {/* Stat rings + streaks */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GlassCard className="flex items-center gap-3">
          <CompletionRing value={habitStats.pct} label="Habits" />
          <div>
            <p className="text-sm font-bold text-foreground">{habitStats.completed}/{habitStats.total}</p>
            <p className="text-xs text-muted-foreground">completed</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <CompletionRing value={taskStats.pct} label="Tasks" />
          <div>
            <p className="text-sm font-bold text-foreground">{taskStats.completedToday}</p>
            <p className="text-xs text-muted-foreground">done today</p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame size={16} className={dashboard.bestStreak > 0 ? "text-orange-500" : ""} />
            <span className="text-xs font-semibold uppercase tracking-wide">Best streak</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{dashboard.bestStreak}</p>
          <p className="text-xs text-muted-foreground">{dashboard.activeStreaks} active</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle size={16} className={dashboard.overdueCount > 0 ? "text-destructive" : ""} />
            <span className="text-xs font-semibold uppercase tracking-wide">Overdue</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{dashboard.overdueCount}</p>
          <p className="text-xs text-muted-foreground">tasks</p>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's habits */}
        <GlassCard className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <CheckSquare size={16} className="text-primary" /> Today’s Habits
            </h3>
            <button
              type="button"
              onClick={() => onNavigate("habits")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all
            </button>
          </div>
          {dashboard.habitsDueToday.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No habits scheduled today.</p>
          ) : (
            <ul className="space-y-2">
              {dashboard.habitsDueToday.map((habit) => {
                const colors = getHabitColorClasses(habit.color);
                const Icon = getHabitIcon(habit.icon);
                const done = habit.stats.completedToday;
                const locked = done && undo.isLocked("habit", habit.id, dashboard.todayKey);
                return (
                  <li key={habit.id} className="flex items-center gap-3">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", colors.chip)}>
                      <Icon size={18} className={colors.icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-semibold text-foreground", done && "line-through opacity-60")}>
                        {habit.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{habit.stats.currentStreak} day streak</p>
                    </div>
                    <button
                      type="button"
                      aria-label={locked ? "Completed — locked for today" : done ? "Undo completion" : "Mark done"}
                      aria-pressed={done}
                      title={locked ? "Already undone once today — locked as done" : undefined}
                      onClick={() => handleHabitClick(habit)}
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition",
                        done
                          ? cn(colors.solid, "border-transparent text-white", locked && "cursor-default opacity-90")
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                      )}
                    >
                      {locked ? <Lock size={13} strokeWidth={2.5} /> : <Check size={16} strokeWidth={done ? 3 : 2} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        {/* Today's tasks */}
        <GlassCard className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ListTodo size={16} className="text-primary" /> Today’s Tasks
            </h3>
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all
            </button>
          </div>
          {dashboard.tasksToday.length === 0 && dashboard.completedTasksToday.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing due today. Enjoy!</p>
          ) : (
            <ul className="space-y-2">
              {[...dashboard.tasksToday, ...dashboard.completedTasksToday].map((task) => {
                const done = task.status === "completed";
                const locked = done && undo.isLocked("task", task.id, dashboard.todayKey);
                return (
                  <li key={task.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={
                        locked ? "Completed — locked for today" : done ? "Undo completion" : "Mark task complete"
                      }
                      aria-pressed={done}
                      title={locked ? "Already undone once today — locked as done" : undefined}
                      onClick={() => handleTaskClick(task)}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
                        done
                          ? cn(
                              "border-transparent bg-primary text-primary-foreground",
                              locked && "cursor-default opacity-90",
                            )
                          : "border-border text-transparent hover:border-primary",
                      )}
                    >
                      {locked ? <Lock size={11} strokeWidth={2.5} /> : <Check size={14} strokeWidth={3} />}
                    </button>
                    <p
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm font-medium text-foreground",
                        done && "line-through opacity-60",
                      )}
                    >
                      {task.title}
                    </p>
                    <span className="shrink-0 text-xs capitalize text-muted-foreground">{task.priority}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>

      {/* Upcoming deadlines + recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <CalendarClock size={16} className="text-primary" /> Upcoming Deadlines
          </h3>
          {dashboard.upcomingDeadlines.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No upcoming deadlines.</p>
          ) : (
            <ul className="space-y-2">
              {dashboard.upcomingDeadlines.map((task: Task) => (
                <li key={task.id} className="flex items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{task.title}</p>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                    {task.deadline ? format(new Date(task.deadline), "MMM d, HH:mm") : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Check size={16} className="text-primary" /> Recent Activity
          </h3>
          {dashboard.recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No activity yet today.</p>
          ) : (
            <ul className="space-y-2">
              {dashboard.recentActivity.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {item.kind === "habit" ? <CheckSquare size={15} /> : <ListTodo size={15} />}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm text-foreground">{item.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.timeLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      {/* Motivational quote */}
      <GlassCard className="flex items-start gap-3">
        <QuoteIcon size={22} className="shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium italic text-foreground">“{quote.text}”</p>
          <p className="mt-1 text-xs text-muted-foreground">— {quote.author}</p>
        </div>
      </GlassCard>

      <HabitFormDialog
        open={habitFormOpen}
        habit={null}
        saving={dashboard.habitCreateMutation.isPending}
        onOpenChange={setHabitFormOpen}
        onSubmit={handleCreateHabit}
      />
      <TaskFormDialog
        open={taskFormOpen}
        task={null}
        saving={dashboard.taskCreateMutation.isPending}
        defaultDueDate={dashboard.todayKey}
        onOpenChange={setTaskFormOpen}
        onSubmit={handleCreateTask}
      />

      <UndoConfirmDialog pending={undo.pending} onConfirm={undo.confirm} onCancel={undo.cancel} />
    </div>
  );
};

export default ProductivityDashboardPage;
