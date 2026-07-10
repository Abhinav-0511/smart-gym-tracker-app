import { useMemo } from "react";

import { getLocalDateString } from "@/types/dashboard";
import { useHabits } from "@/features/productivity/hooks/useHabits";
import { useTasks } from "@/features/productivity/hooks/useTasks";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import { isHabitDueOn } from "@/features/productivity/types/habit";
import { parseDateKey } from "@/features/productivity/lib/date-keys";
import { getTaskDerivedStatus, type Task } from "@/features/productivity/types/task";

export interface ActivityItem {
  id: string;
  kind: "habit" | "task";
  title: string;
  sortKey: string;
  timeLabel: string;
}

/**
 * Composes the habit and task hooks into the aggregates the Productivity
 * dashboard renders. Reuses the same query keys as the Habits/Tasks pages, so
 * completing an item here updates those pages instantly (shared cache).
 */
export function useProductivityDashboard(userId: string | undefined, timezone: string) {
  const todayKey = getLocalDateString(new Date(), timezone);
  const habits = useHabits(userId, timezone, false);
  const tasks = useTasks(userId, timezone, false);

  const habitList = useMemo(
    () => (habits.habitsQuery.data ?? []).filter((habit) => habit.status === "active"),
    [habits.habitsQuery.data],
  );
  const taskList = useMemo(() => tasks.tasksQuery.data ?? [], [tasks.tasksQuery.data]);

  const derived = useMemo(() => {
    const now = new Date();
    const todayDate = parseDateKey(todayKey);

    const habitsDueToday = habitList.filter((habit) => isHabitDueOn(habit, todayDate));
    const habitsCompleted = habitsDueToday.filter((habit) => habit.stats.completedToday);
    const habitPct = habitsDueToday.length
      ? Math.round((habitsCompleted.length / habitsDueToday.length) * 100)
      : 0;
    const bestStreak = habitList.reduce((max, habit) => Math.max(max, habit.stats.currentStreak), 0);
    const activeStreaks = habitList.filter((habit) => habit.stats.currentStreak > 0).length;

    const pending = taskList.filter((task) => task.status === "pending");
    const tasksToday = pending.filter(
      (task) => task.dueDate === todayKey || getTaskDerivedStatus(task, now) === "overdue",
    );
    const overdue = pending.filter((task) => getTaskDerivedStatus(task, now) === "overdue");
    const completedToday = taskList.filter(
      (task) =>
        task.status === "completed"
        && task.completedAt
        && getLocalDateString(new Date(task.completedAt), timezone) === todayKey,
    );
    const taskDenominator = tasksToday.length + completedToday.length;
    const taskPct = taskDenominator
      ? Math.round((completedToday.length / taskDenominator) * 100)
      : 0;

    const upcomingDeadlines = pending
      .filter((task) => task.deadline && new Date(task.deadline).getTime() >= now.getTime())
      .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
      .slice(0, 5);

    const recentActivity: ActivityItem[] = [
      ...completedToday.map((task) => ({
        id: `task-${task.id}`,
        kind: "task" as const,
        title: task.title,
        sortKey: task.completedAt ?? `${todayKey}T00:00:00.000Z`,
        timeLabel: "Completed",
      })),
      ...habitsCompleted.map((habit) => ({
        id: `habit-${habit.id}`,
        kind: "habit" as const,
        title: habit.title,
        sortKey: `${todayKey}T00:00:00.000Z`,
        timeLabel: "Done today",
      })),
    ]
      .sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1))
      .slice(0, 6);

    return {
      habitsDueToday,
      habitStats: {
        completed: habitsCompleted.length,
        total: habitsDueToday.length,
        remaining: habitsDueToday.length - habitsCompleted.length,
        pct: habitPct,
      },
      bestStreak,
      activeStreaks,
      tasksToday,
      overdueCount: overdue.length,
      upcomingDeadlines,
      taskStats: {
        completedToday: completedToday.length,
        pct: taskPct,
      },
      recentActivity,
    };
  }, [habitList, taskList, todayKey, timezone]);

  return {
    todayKey,
    isLoading: habits.habitsQuery.isLoading || tasks.tasksQuery.isLoading,
    isError: habits.habitsQuery.isError || tasks.tasksQuery.isError,
    refetch: () => {
      void habits.habitsQuery.refetch();
      void tasks.tasksQuery.refetch();
    },
    ...derived,
    toggleHabit: (habit: HabitWithHistory, complete: boolean) =>
      habits.toggleMutation.mutate({ habit, dateKey: todayKey, complete }),
    toggleTask: (task: Task) =>
      tasks.statusMutation.mutate({
        taskId: task.id,
        status: task.status === "completed" ? "pending" : "completed",
      }),
    // Exposed so the dashboard's quick-add can create items without a second
    // subscription to the same queries.
    habitCreateMutation: habits.createMutation,
    taskCreateMutation: tasks.createMutation,
  };
}
