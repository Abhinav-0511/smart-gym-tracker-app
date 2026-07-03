import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { getGreeting, getLocalDateString } from "@/types/dashboard";
import { getWeekday } from "@/types/workout-plan";

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

const DashboardPage = ({ onNavigate }: DashboardPageProps) => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const {
    plansQuery,
    sessionQuery,
    recordsQuery,
    aggregateQuery,
    isPending,
    error,
  } = useDashboard(user?.id, timezone);

  if (isPending) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading dashboard">
        <div className="h-16 rounded-2xl bg-secondary animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
        <div className="h-36 rounded-2xl bg-secondary animate-pulse" />
      </div>
    );
  }

  if (error || !profile || !aggregateQuery.data) {
    return (
      <GlassCard className="text-center py-8">
        <AlertCircle className="text-destructive mx-auto mb-3" />
        <p className="font-semibold text-foreground">Couldn’t load your dashboard</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : "Please try again."}
        </p>
        <Button
          className="mt-4"
          onClick={() =>
            void Promise.all([
              plansQuery.refetch(),
              sessionQuery.refetch(),
              recordsQuery.refetch(),
              aggregateQuery.refetch(),
            ])
          }
        >
          <RefreshCw size={16} />
          Retry
        </Button>
      </GlassCard>
    );
  }

  const aggregate = aggregateQuery.data;
  const plans = plansQuery.data ?? [];
  const activePlan = plans.find((plan) => plan.isActive) ?? null;
  const activeSession = sessionQuery.data ?? null;
  const records = recordsQuery.data;
  const today = getLocalDateString(new Date(), timezone);
  const todayDate = new Date(`${today}T00:00:00.000Z`);
  const todayDayOfWeek = todayDate.getUTCDay() === 0 ? 7 : todayDate.getUTCDay();
  const todayPlanDay =
    activePlan?.days.find((day) => day.dayOfWeek === todayDayOfWeek) ?? null;
  const greeting = getGreeting(new Date(), timezone);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-muted-foreground text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-foreground">{profile.full_name} 👋</h1>
      </div>

      <GlassCard className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center gap-3">
          <Zap className="text-primary" size={24} />
          <div>
            <p className="font-semibold text-foreground text-sm">
              {activeSession
                ? "Your workout is ready to continue"
                : aggregate.currentStreak > 0
                  ? "Keep your streak moving"
                  : "Ready for your next workout?"}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeSession
                ? `${activeSession.title} has been autosaved.`
                : aggregate.currentStreak > 0
                  ? `You’re on a ${aggregate.currentStreak}-day streak.`
                  : "Completed workouts will build your consistency streak."}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Current Streak"
          value={`${aggregate.currentStreak} days`}
          icon={<Flame size={18} />}
        />
        <StatCard
          label="Longest Streak"
          value={`${aggregate.longestStreak} days`}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Workouts"
          value={aggregate.totalCompletedWorkouts}
          icon={<Dumbbell size={18} />}
        />
        <StatCard
          label="PRs"
          value={aggregate.totalPRCount}
          icon={<Trophy size={18} />}
        />
        <StatCard
          label="This Week"
          value={`${aggregate.weeklyCompletedDays}/7`}
          icon={<Target size={18} />}
        />
        <StatCard
          label="Active Plan"
          value={activePlan?.name ?? "None"}
          icon={<CalendarDays size={18} />}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">
            {activeSession ? "Workout in Progress" : "Today’s Workout"}
          </h2>
          <span className="text-xs text-primary font-medium">
            {getWeekday(todayDayOfWeek).day}
          </span>
        </div>
        {activeSession ? (
          <GlassCard hover className="group" onClick={() => onNavigate("workout")}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground text-lg">{activeSession.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeSession.exercises.length} exercises · autosaved
                </p>
              </div>
              <ChevronRight className="text-primary" />
            </div>
          </GlassCard>
        ) : todayPlanDay ? (
          <GlassCard
            hover={!todayPlanDay.isRestDay}
            className="group"
            onClick={() => !todayPlanDay.isRestDay && onNavigate("workout")}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground text-lg">
                  {todayPlanDay.workoutType}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {todayPlanDay.isRestDay
                    ? "Recovery day"
                    : `${todayPlanDay.exercises.length} exercises`}
                </p>
                {!todayPlanDay.isRestDay && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {todayPlanDay.exercises.slice(0, 3).map((exercise) => (
                      <span
                        key={exercise.id}
                        className="text-xs bg-secondary px-2 py-1 rounded-lg text-secondary-foreground"
                      >
                        {exercise.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {!todayPlanDay.isRestDay && (
                <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="text-center text-sm text-muted-foreground py-7">
            No workout is scheduled for today.
          </GlassCard>
        )}
      </div>

      <Button
        size="lg"
        className="w-full text-base font-bold"
        onClick={() => onNavigate("workout")}
      >
        <Dumbbell size={20} />
        {activeSession ? "Continue Workout" : "Start Workout"}
      </Button>

      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">This Week</h2>
        <div className="flex gap-2">
          {aggregate.weeklyDays.map((day) => {
            const planDay = activePlan?.days.find(
              (item) => item.dayOfWeek === day.dayOfWeek,
            );
            const isRest = planDay?.isRestDay ?? false;

            return (
              <div
                key={day.date}
                className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl ${
                  day.completed
                    ? "bg-primary/15 border border-primary/30"
                    : isRest
                      ? "bg-secondary/50"
                      : "bg-secondary"
                }`}
              >
                <span className="text-[10px] text-muted-foreground font-medium">
                  {day.shortDay}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  day.completed
                    ? "bg-primary"
                    : isRest
                      ? "bg-muted-foreground/30"
                      : "bg-muted-foreground/50"
                }`} />
                <span className="text-[9px] text-muted-foreground truncate max-w-full">
                  {isRest ? "Rest" : planDay?.workoutType ?? "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <GlassCard>
          <div className="flex items-center gap-2 mb-2">
            <Clock3 size={16} className="text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Last Workout</h3>
          </div>
          {aggregate.lastWorkout ? (
            <>
              <p className="font-medium text-foreground">{aggregate.lastWorkout.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {aggregate.lastWorkout.workoutDate}
                {aggregate.lastWorkout.durationMinutes !== null
                  ? ` · ${aggregate.lastWorkout.durationMinutes} min`
                  : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No completed workouts yet.</p>
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={16} className="text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Plan Summary</h3>
          </div>
          {activePlan ? (
            <>
              <p className="font-medium text-foreground">{activePlan.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activePlan.days.filter((day) => !day.isRestDay).length} training days ·{" "}
                {activePlan.days.reduce(
                  (total, day) => total + day.exercises.length,
                  0,
                )} exercises
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No active plan.</p>
          )}
        </GlassCard>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Recent PRs</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("prs")}>
            View All
          </Button>
        </div>
        {records?.records.length ? (
          <div className="space-y-2">
            {records.records.slice(0, 3).map((record) => (
              <GlassCard key={record.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {record.exerciseName}
                    </p>
                    <p className="text-xs text-muted-foreground">{record.achievedOn}</p>
                  </div>
                  <p className="font-bold text-foreground">{record.weightKg}kg</p>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="text-center text-sm text-muted-foreground">
            No personal records yet.
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
