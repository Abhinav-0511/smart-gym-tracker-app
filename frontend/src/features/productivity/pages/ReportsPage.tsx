import { useMemo, useState } from "react";
import { CalendarRange, Flame, Target, TrendingUp } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { MILESTONE } from "@/features/onboarding/milestones";
import { useMarkMilestoneOnMount } from "@/features/onboarding/useMarkMilestoneOnMount";
import { useHabits } from "@/features/productivity/hooks/useHabits";
import { useTasks } from "@/features/productivity/hooks/useTasks";
import CompletionTrendChart from "@/features/productivity/components/CompletionTrendChart";
import {
  buildProductivityReport,
  REPORT_PERIODS,
  type ReportPeriod,
} from "@/features/productivity/lib/reports";
import { cn } from "@/lib/utils";

const ReportsPage = () => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  useMarkMilestoneOnMount(MILESTONE.viewedProductivityReports);

  const habits = useHabits(user?.id, timezone, true);
  const tasks = useTasks(user?.id, timezone, true);
  const todayKey = tasks.todayKey;

  const [period, setPeriod] = useState<ReportPeriod>("week");

  const habitList = useMemo(() => habits.habitsQuery.data ?? [], [habits.habitsQuery.data]);
  const taskList = useMemo(() => tasks.tasksQuery.data ?? [], [tasks.tasksQuery.data]);
  const isLoading = habits.habitsQuery.isLoading || tasks.tasksQuery.isLoading;

  const report = useMemo(() => {
    const days = REPORT_PERIODS.find((item) => item.id === period)?.days ?? 7;
    return buildProductivityReport({ habits: habitList, tasks: taskList, todayKey, periodDays: days, timezone });
  }, [habitList, taskList, todayKey, period, timezone]);

  const maxCategory = report.categoryBreakdown[0]?.count ?? 0;

  const stats = [
    { label: "Habit success", value: `${report.habitSuccessRate}%`, icon: Target },
    { label: "Task completion", value: `${report.taskCompletionRate}%`, icon: TrendingUp },
    { label: "Longest streak", value: report.longestStreak, icon: Flame },
    { label: "Best day", value: report.mostProductiveDay ?? "—", icon: CalendarRange },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56 rounded-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {REPORT_PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPeriod(item.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              period === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <stat.icon size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className="mt-1 truncate text-2xl font-extrabold text-foreground">{stat.value}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Completion Trend</h3>
            <p className="text-xs text-muted-foreground">
              {report.habitCompletions} habit check-ins · {report.tasksCompleted} tasks done
            </p>
          </div>
        </div>
        <div className="h-64">
          {report.trend.some((point) => point.habits > 0 || point.tasks > 0) ? (
            <CompletionTrendChart data={report.trend} />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Complete habits and tasks to see your trend build up here.
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 font-semibold text-foreground">Habit Categories</h3>
        {report.categoryBreakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No habits to break down yet.</p>
        ) : (
          <ul className="space-y-3">
            {report.categoryBreakdown.map((slice) => (
              <li key={slice.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium capitalize text-foreground">{slice.category}</span>
                  <span className="text-muted-foreground">{slice.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${maxCategory ? (slice.count / maxCategory) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
};

export default ReportsPage;
