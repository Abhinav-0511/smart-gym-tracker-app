import { useMemo } from "react";
import {
  Activity,
  CalendarCheck,
  CheckSquare,
  Flame,
  Gauge,
  Heart,
  ListChecks,
  LoaderCircle,
  Star,
  Timer,
  Trophy,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import AccountSection from "@/components/profile/AccountSection";
import ProfileHero from "@/components/profile/ProfileHero";
import SectionHeader from "@/components/ui/section-header";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/features/productivity/hooks/useHabits";
import { useTasks } from "@/features/productivity/hooks/useTasks";
import { buildProductivityReport } from "@/features/productivity/lib/reports";
import {
  computeProductivityScore,
  scoreBand,
} from "@/features/productivity/lib/productivity-score";

const ProductivityProfilePage = () => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";

  const { todayKey, habitsQuery } = useHabits(user?.id, timezone, false);
  const { tasksQuery } = useTasks(user?.id, timezone, false);

  const habits = useMemo(() => habitsQuery.data ?? [], [habitsQuery.data]);
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  const isLoading = habitsQuery.isPending || tasksQuery.isPending;

  const metrics = useMemo(() => {
    const weekReport = buildProductivityReport({ habits, tasks, todayKey, periodDays: 7, timezone });
    const monthReport = buildProductivityReport({ habits, tasks, todayKey, periodDays: 30, timezone });

    const activeHabits = habits.filter((habit) => habit.status === "active");
    const activeStreaks = activeHabits.filter((habit) => habit.stats.currentStreak > 0).length;
    const longestStreak = habits.reduce(
      (max, habit) => Math.max(max, habit.stats.longestStreak),
      0,
    );
    const totalCompletions = habits.reduce(
      (sum, habit) => sum + habit.stats.totalCompletions,
      0,
    );
    const tasksCompleted = tasks.filter((task) => task.status === "completed").length;
    const favorite = [...habits].sort(
      (a, b) => b.stats.totalCompletions - a.stats.totalCompletions,
    )[0];

    const score = computeProductivityScore({
      habitSuccessRate: monthReport.habitSuccessRate,
      taskCompletionRate: monthReport.taskCompletionRate,
      activeStreaks,
    });

    return {
      weekReport,
      monthReport,
      activeHabitsCount: activeHabits.length,
      activeStreaks,
      longestStreak,
      totalCompletions,
      tasksCompleted,
      favorite,
      score,
    };
  }, [habits, tasks, todayKey, timezone]);

  const {
    weekReport,
    monthReport,
    activeHabitsCount,
    longestStreak,
    totalCompletions,
    tasksCompleted,
    favorite,
    score,
  } = metrics;

  return (
    <div className="space-y-6 animate-fade-in">
      <ProfileHero
        eyebrow="Productivity Profile"
        accentClassName="from-violet-500/20 via-violet-500/5 to-transparent"
        stats={
          isLoading
            ? undefined
            : [
                { label: "score", value: String(score) },
                { label: "active habits", value: String(activeHabitsCount) },
                { label: "best streak", value: `${longestStreak}d` },
              ]
        }
      />

      {isLoading ? (
        <GlassCard className="py-8 text-center" role="status">
          <LoaderCircle className="mx-auto animate-spin text-primary" size={22} />
          <span className="sr-only">Loading productivity statistics</span>
        </GlassCard>
      ) : (
        <>
          {/* Productivity score banner */}
          <GlassCard className="bg-gradient-to-br from-violet-500/10 to-transparent">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-500">
                <Gauge size={26} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Productivity score
                </p>
                <p className="text-3xl font-extrabold tracking-tight text-foreground">
                  {score}
                  <span className="ml-1 text-base font-semibold text-muted-foreground">/100</span>
                </p>
                <p className="text-xs font-medium text-violet-500">{scoreBand(score)}</p>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="Active Habits" value={activeHabitsCount} icon={<CheckSquare size={18} />} />
            <StatCard label="Longest Streak" value={`${longestStreak} days`} icon={<Flame size={18} />} />
            <StatCard label="Habit Completions" value={totalCompletions} icon={<Activity size={18} />} />
            <StatCard label="Tasks Completed" value={tasksCompleted} icon={<ListChecks size={18} />} />
            <StatCard
              label="Calendar (30d)"
              value={`${monthReport.habitSuccessRate}%`}
              icon={<CalendarCheck size={18} />}
            />
            <StatCard
              label="Task Rate (30d)"
              value={`${monthReport.taskCompletionRate}%`}
              icon={<Trophy size={18} />}
            />
          </div>

          {/* Favorite habit + weekly / monthly statistics */}
          <div className="grid gap-3 lg:grid-cols-2">
            <GlassCard>
              <div className="mb-2 flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Favorite habit</h3>
              </div>
              {favorite ? (
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">{favorite.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {favorite.stats.totalCompletions} completions · {favorite.stats.currentStreak}-day streak
                    </p>
                  </div>
                  <Heart size={20} className="shrink-0 text-rose-500" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Create your first habit to see your favourite here.
                </p>
              )}
            </GlassCard>

            <GlassCard>
              <div className="mb-3 flex items-center gap-2">
                <Timer size={16} className="text-muted-foreground" />
                <h3 className="text-sm font-bold text-foreground">This week vs this month</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Week</p>
                  <p className="mt-1 font-bold text-foreground">{weekReport.habitCompletions} habits</p>
                  <p className="text-xs text-muted-foreground">{weekReport.tasksCompleted} tasks · {weekReport.habitSuccessRate}%</p>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Month</p>
                  <p className="mt-1 font-bold text-foreground">{monthReport.habitCompletions} habits</p>
                  <p className="text-xs text-muted-foreground">{monthReport.tasksCompleted} tasks · {monthReport.habitSuccessRate}%</p>
                </div>
              </div>
              {monthReport.mostProductiveDay && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Most productive day:{" "}
                  <span className="font-semibold text-foreground">{monthReport.mostProductiveDay}</span>
                </p>
              )}
            </GlassCard>
          </div>

          {/* Habit analytics */}
          {monthReport.categoryBreakdown.length > 0 && (
            <div>
              <SectionHeader className="mb-3" title="Habit analytics" />
              <GlassCard className="space-y-2.5">
                {monthReport.categoryBreakdown.map((slice) => {
                  const max = monthReport.categoryBreakdown[0]?.count || 1;
                  return (
                    <div key={slice.category}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium capitalize text-foreground">{slice.category}</span>
                        <span className="text-muted-foreground">{slice.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-[width]"
                          style={{ width: `${Math.round((slice.count / max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </GlassCard>
            </div>
          )}

          {/* Future-ready */}
          <GlassCard className="border-dashed">
            <div className="mb-1 flex items-center gap-2">
              <Timer size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">Focus time</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Deep-work session tracking is on the way. Coming soon.
            </p>
          </GlassCard>
        </>
      )}

      <AccountSection />
    </div>
  );
};

export default ProductivityProfilePage;
