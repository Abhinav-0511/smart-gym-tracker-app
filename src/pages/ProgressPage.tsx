import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  Clock3,
  Dumbbell,
  LoaderCircle,
  RefreshCw,
  Target,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--popover-foreground))",
  fontSize: "12px",
};

const EmptyChart = ({ message }: { message: string }) => (
  <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground">
    {message}
  </div>
);

function formatTrend(value: number | null, suffix = "%"): string {
  if (value === null) return "No prior period";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}${suffix}`;
}

const ProgressPage = () => {
  const { user, profile } = useAuth();
  const progressQuery = useProgress(user?.id, profile?.timezone ?? "UTC");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const data = progressQuery.data;

  useEffect(() => {
    if (!selectedExerciseId && data?.exerciseProgressions.length) {
      setSelectedExerciseId(data.exerciseProgressions[0].exerciseId);
    }
  }, [data?.exerciseProgressions, selectedExerciseId]);

  if (progressQuery.isPending) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status">
        <LoaderCircle className="animate-spin text-primary" />
        <span className="sr-only">Loading progress</span>
      </div>
    );
  }

  if (progressQuery.isError || !data) {
    return (
      <GlassCard className="text-center py-8">
        <AlertCircle className="text-destructive mx-auto mb-3" />
        <p className="font-semibold text-foreground">Couldn’t load progress</p>
        <p className="text-sm text-muted-foreground mt-1">
          {progressQuery.error?.message ?? "Please try again."}
        </p>
        <Button className="mt-4" onClick={() => void progressQuery.refetch()}>
          <RefreshCw size={16} />
          Retry
        </Button>
      </GlassCard>
    );
  }

  const selectedExercise =
    data.exerciseProgressions.find(
      (exercise) => exercise.exerciseId === selectedExerciseId,
    ) ?? null;
  const latestWeeklyWorkouts = data.weeklyFrequency.at(-1)?.value ?? 0;
  const latestVolume = data.weeklyVolume.at(-1)?.value ?? 0;
  const strengthChange =
    selectedExercise && selectedExercise.points.length > 1
      ? selectedExercise.points.at(-1)!.value - selectedExercise.points[0].value
      : null;
  const hasCompletedWorkouts = data.weeklyFrequency.some(
    (period) => period.value > 0,
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Progress</h1>
        <p className="text-sm text-muted-foreground">Track your fitness journey</p>
      </div>

      {!hasCompletedWorkouts && data.bodyWeight.length === 0 && (
        <GlassCard className="text-center py-6">
          <p className="font-semibold text-foreground">No progress history yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete a workout to populate training charts, or add your current
            weight from Profile to begin weight tracking.
          </p>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Consistency"
          value={`${data.consistencyPercent}%`}
          icon={<Target size={18} />}
        />
        <StatCard
          label="Avg Duration"
          value={
            data.averageWorkoutDurationMinutes === null
              ? "—"
              : `${data.averageWorkoutDurationMinutes} min`
          }
          icon={<Clock3 size={18} />}
        />
        <StatCard
          label="This Week"
          value={latestWeeklyWorkouts}
          icon={<Activity size={18} />}
          trend={formatTrend(data.workoutTrendPercent)}
          trendUp={(data.workoutTrendPercent ?? 0) >= 0}
        />
        <StatCard
          label="Weekly Volume"
          value={`${latestVolume.toLocaleString()} kg`}
          icon={<Dumbbell size={18} />}
          trend={formatTrend(data.volumeTrendPercent)}
          trendUp={(data.volumeTrendPercent ?? 0) >= 0}
        />
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Body Weight</h3>
          <span className="text-xs text-primary font-medium">
            {data.bodyWeightChangeKg === null
              ? "No trend yet"
              : formatTrend(data.bodyWeightChangeKg, " kg")}
          </span>
        </div>
        <div className="h-44">
          {data.bodyWeight.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.bodyWeight}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(200, 100%, 55%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(200, 100%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="weight" stroke="hsl(200, 100%, 55%)" fill="url(#weightGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Add your current weight from Profile to start this chart." />
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Strength Progress</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {strengthChange === null
                ? "Complete more weighted sets to establish a trend."
                : `${strengthChange >= 0 ? "+" : ""}${strengthChange.toFixed(1)} kg`}
            </p>
          </div>
          {data.exerciseProgressions.length ? (
            <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
              <SelectTrigger className="w-44" aria-label="Progress exercise">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.exerciseProgressions.map((exercise) => (
                  <SelectItem key={exercise.exerciseId} value={exercise.exerciseId}>
                    {exercise.exerciseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
        <div className="h-48">
          {selectedExercise?.points.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedExercise.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" name="Weight" stroke="hsl(142, 100%, 45%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Complete weighted workout sets to start this chart." />
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold text-foreground mb-4">Workout Frequency</h3>
        <Tabs defaultValue="weekly">
          <TabsList className="mb-3">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyFrequency}>
                  <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Workouts" fill="hsl(142, 100%, 45%)" radius={[6, 6, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="monthly">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyFrequency}>
                  <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Workouts" fill="hsl(200, 100%, 55%)" radius={[6, 6, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold text-foreground mb-4">Training Volume</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.weeklyVolume}>
              <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" name="Volume" stroke="hsl(45, 100%, 50%)" fill="hsl(45, 100%, 50%)" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold text-foreground mb-4">Average Workout Duration</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.weeklyDuration}>
              <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" name="Minutes" stroke="hsl(200, 100%, 55%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
};

export default ProgressPage;
