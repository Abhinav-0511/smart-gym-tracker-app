import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Pencil,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import GettingStartedCard from "@/features/onboarding/checklist/GettingStartedCard";
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
  const todayCompletedWorkout = aggregate.todayCompletedWorkout;
  const greeting = getGreeting(new Date(), timezone);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-muted-foreground text-sm">{greeting},</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{profile.full_name} 👋</h1>
      </div>

      <GettingStartedCard moduleId="fitness" />

      <GlassCard className="border-primary/25 bg-primary/[.06]">
        <div className="flex items-center gap-3">
          <Zap className="text-primary" size={24} />
          <div>
            <p className="font-semibold text-foreground text-sm">
              {activeSession
                ? "Your workout is ready to continue"
                : todayCompletedWorkout
                  ? "Today's workout is completed"
                : aggregate.currentStreak > 0
                  ? "Keep your streak moving"
                  : "Ready for your next workout?"}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeSession
                ? `${activeSession.title} has been autosaved.`
                : todayCompletedWorkout
                  ? "Review your saved workout history or edit the saved entry."
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
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
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
                <h3 className="text-lg font-semibold text-foreground">{activeSession.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeSession.exercises.length} exercises · autosaved
                </p>
              </div>
              <ChevronRight className="text-primary" />
            </div>
          </GlassCard>
        ) : todayCompletedWorkout ? (
          <GlassCard className="border-primary/25 bg-primary/[.04]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-primary" size={20} />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Today's workout completed
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {todayCompletedWorkout.title} is saved to your history.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => onNavigate("workout")}>
                  <Pencil size={16} />
                  Review Workout
                </Button>
              </div>
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
                <h3 className="text-lg font-semibold text-foreground">
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
          <GlassCard className="text-center py-7">
            <p className="font-medium text-foreground">
              {activePlan ? "No workout is scheduled for today" : "Create your first workout plan"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activePlan
                ? "Add today to your active plan if you want to train."
                : "Start building your stronger self — add training days and exercises to begin."}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => onNavigate("plan")}
            >
              {activePlan ? "Edit Plan" : "Create Plan"}
            </Button>
          </GlassCard>
        )}
      </div>

      <Button
        size="lg"
        className="w-full text-base font-semibold"
        onClick={() => onNavigate(activePlan || activeSession ? "workout" : "plan")}
      >
        {todayCompletedWorkout ? <Pencil size={20} /> : <Dumbbell size={20} />}
        {activeSession
          ? "Continue Workout"
          : todayCompletedWorkout
            ? "Review Workout"
          : activePlan
            ? "Start Workout"
            : "Create Workout Plan"}
      </Button>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">This Week</h2>
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
                <span className="text-xs text-muted-foreground font-medium">
                  {day.shortDay}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  day.completed
                    ? "bg-primary"
                    : isRest
                      ? "bg-muted-foreground/30"
                      : "bg-muted-foreground/50"
                }`} />
                <span className="max-w-full truncate text-[11px] text-muted-foreground">
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
            <p className="text-sm text-muted-foreground">
              Complete your first planned workout to see its summary here.
            </p>
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
            <button
              type="button"
              className="text-left text-sm text-primary hover:underline"
              onClick={() => onNavigate("plan")}
            >
              No active plan. Create one to get started.
            </button>
          )}
        </GlassCard>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent PRs</h2>
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
          <GlassCard className="text-center">
            <p className="text-sm text-muted-foreground">
              Complete weighted sets to build your personal-record history.
            </p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => onNavigate("prs")}>
              View Personal Records
            </Button>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
