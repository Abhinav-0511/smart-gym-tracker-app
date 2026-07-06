import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Timer,
  XCircle,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import AddExerciseDialog from "@/components/plan/AddExerciseDialog";
import SessionExerciseCard from "@/components/workout/SessionExerciseCard";
import { Button } from "@/components/ui/button";
import PageSkeleton from "@/components/ui/page-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWorkoutPlans } from "@/hooks/useWorkoutPlans";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { getWeekday } from "@/types/workout-plan";
import type { WorkoutSetUpdate } from "@/types/workout-session";

function getCurrentDayOfWeek(timezone: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: timezone,
  }).format(new Date());
  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return weekdays.indexOf(weekday) + 1;
}

function useWorkoutDuration(startedAt: string | undefined): string {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return "00:00";

  const seconds = Math.max(
    0,
    Math.floor((now - new Date(startedAt).getTime()) / 1000),
  );
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours > 0 ? hours : null, minutes, remainingSeconds]
    .filter((value) => value !== null)
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

const WorkoutPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { plansQuery, catalogQuery } = useWorkoutPlans(user?.id);
  const {
    sessionQuery,
    startMutation,
    setMutation,
    notesMutation,
    completeMutation,
    cancelMutation,
    addExerciseMutation,
    removeExerciseMutation,
  } = useWorkoutSession(user?.id);
  const [selectedDayId, setSelectedDayId] = useState("");
  const [notes, setNotes] = useState("");
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);

  const activePlan = plansQuery.data?.find((plan) => plan.isActive) ?? null;
  const trainingDays = useMemo(
    () => activePlan?.days.filter((day) => !day.isRestDay) ?? [],
    [activePlan],
  );
  const selectedDay =
    trainingDays.find((day) => day.id === selectedDayId) ?? trainingDays[0] ?? null;
  const session = sessionQuery.data ?? null;
  const duration = useWorkoutDuration(session?.startedAt);

  useEffect(() => {
    if (!trainingDays.length || selectedDayId) return;

    const today = getCurrentDayOfWeek(profile?.timezone ?? "UTC");
    const todayPlan = trainingDays.find((day) => day.dayOfWeek === today);
    setSelectedDayId((todayPlan ?? trainingDays[0]).id);
  }, [profile?.timezone, selectedDayId, trainingDays]);

  useEffect(() => {
    setNotes(session?.notes ?? "");
  }, [session?.id, session?.notes]);

  useEffect(() => {
    if (!session || notes === session.notes) return;

    const timer = window.setTimeout(() => {
      notesMutation.mutate(
        { sessionId: session.id, notes },
        {
          onError: (error) =>
            toast({
              variant: "destructive",
              title: "Notes couldn’t be saved",
              description: error instanceof Error ? error.message : "Please try again.",
            }),
        },
      );
    }, 750);

    return () => window.clearTimeout(timer);
  }, [notes, notesMutation, session, toast]);

  const handleSetUpdate = async (setId: string, updates: WorkoutSetUpdate) => {
    if (!session) return;
    try {
      await setMutation.mutateAsync({ sessionId: session.id, setId, updates });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Set couldn’t be saved",
        description: error instanceof Error ? error.message : "Please try again.",
      });
      throw error;
    }
  };

  const handleStart = async () => {
    if (!selectedDay) return;
    setOutcome(null);
    try {
      await startMutation.mutateAsync({ planDay: selectedDay });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn’t start workout",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleComplete = async () => {
    if (!session) return;
    try {
      if (notes !== session.notes) {
        await notesMutation.mutateAsync({ sessionId: session.id, notes });
      }
      await completeMutation.mutateAsync(session.id);
      setOutcome("Workout completed and saved to your history.");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn’t finish workout",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleCancel = async () => {
    if (!session || !window.confirm("Cancel this workout? Its draft will be locked.")) {
      return;
    }
    try {
      await cancelMutation.mutateAsync(session.id);
      setOutcome("Workout cancelled.");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn’t cancel workout",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  if (sessionQuery.isPending || plansQuery.isPending) {
    return <PageSkeleton label="Loading workout" variant="detail" />;
  }

  if (sessionQuery.isError) {
    return (
      <GlassCard className="text-center py-8">
        <AlertCircle className="text-destructive mx-auto mb-3" />
        <p className="font-semibold text-foreground">Couldn’t restore your workout</p>
        <p className="text-sm text-muted-foreground mt-1">
          {sessionQuery.error.message}
        </p>
        <Button className="mt-4" onClick={() => void sessionQuery.refetch()}>
          <RefreshCw size={16} />
          Retry
        </Button>
      </GlassCard>
    );
  }

  if (session) {
    const allSets = session.exercises.flatMap((exercise) => exercise.sets);
    const completedSets = allSets.filter((set) => set.isCompleted).length;
    const busy =
      setMutation.isPending
      || completeMutation.isPending
      || cancelMutation.isPending
      || addExerciseMutation.isPending
      || removeExerciseMutation.isPending;

    return (
      <div className="space-y-5 animate-fade-in">
        <div className="sticky top-[65px] z-20 -mx-4 flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">{session.title}</h1>
            <p className="text-sm text-muted-foreground">
              {session.exercises.length} exercises · {completedSets}/{allSets.length} sets
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <Timer size={16} />
            <span className="text-sm font-mono font-medium">{duration}</span>
          </div>
        </div>

        <GlassCard className="border-primary/20 bg-primary/[.04]">
          <div className="flex items-center gap-2">
            <Save size={16} className="text-primary" />
            <p className="text-sm text-foreground">
              Workout changes are saved automatically.
            </p>
          </div>
        </GlassCard>

        <div className="space-y-3">
          {session.exercises.map((exercise) => (
            <SessionExerciseCard
              key={exercise.id}
              exercise={exercise}
              disabled={busy}
              onUpdateSet={handleSetUpdate}
              onRemove={async (sessionExerciseId) => {
                try {
                  await removeExerciseMutation.mutateAsync({
                    sessionId: session.id,
                    sessionExerciseId,
                  });
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "Couldn’t remove exercise",
                    description: error instanceof Error ? error.message : "Please try again.",
                  });
                }
              }}
            />
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full"
          disabled={catalogQuery.isPending || busy}
          onClick={() => setAddExerciseOpen(true)}
        >
          <Plus size={18} />
          Add Exercise
        </Button>

        <GlassCard>
          <label htmlFor="workout-notes" className="text-sm font-medium text-foreground block mb-2">
            Workout Notes
          </label>
          <textarea
            id="workout-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => {
              if (notes !== session.notes) {
                notesMutation.mutate({ sessionId: session.id, notes });
              }
            }}
            maxLength={5000}
            placeholder="How did it feel? Any adjustments?"
            className="w-full bg-secondary rounded-xl p-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary resize-none h-20 placeholder:text-muted-foreground transition-all"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            {notesMutation.isPending ? "Saving…" : "Autosaved"}
          </p>
        </GlassCard>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="text-destructive border-destructive/30"
            disabled={busy}
            onClick={() => void handleCancel()}
          >
            <XCircle size={18} />
            Cancel
          </Button>
          <Button size="lg" disabled={busy} onClick={() => void handleComplete()}>
            <CheckCircle2 size={18} />
            Finish Workout
          </Button>
        </div>

        <AddExerciseDialog
          open={addExerciseOpen}
          catalog={catalogQuery.data ?? []}
          existingExerciseIds={session.exercises.map((exercise) => exercise.exerciseId)}
          saving={addExerciseMutation.isPending}
          onOpenChange={setAddExerciseOpen}
          onAdd={async (exerciseId) => {
            await addExerciseMutation.mutateAsync({
              sessionId: session.id,
              exerciseId,
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {selectedDay ? `${selectedDay.workoutType} Day` : "Workout"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {activePlan?.name ?? "No active workout plan"}
        </p>
      </div>

      {outcome && (
        <GlassCard className="border-primary/20 bg-primary/5">
          <p className="text-sm text-foreground">{outcome}</p>
        </GlassCard>
      )}

      {!activePlan || !trainingDays.length ? (
        <GlassCard className="text-center py-8">
          <p className="font-semibold text-foreground">No active training day available</p>
          <p className="text-sm text-muted-foreground mt-1">
            Configure and activate a workout plan before starting a session.
          </p>
        </GlassCard>
      ) : (
        <>
          {trainingDays.length > 1 && (
            <Select value={selectedDay?.id} onValueChange={setSelectedDayId}>
              <SelectTrigger aria-label="Workout day">
                <SelectValue placeholder="Choose workout day" />
              </SelectTrigger>
              <SelectContent>
                {trainingDays.map((day) => (
                  <SelectItem key={day.id} value={day.id}>
                    {getWeekday(day.dayOfWeek).day} — {day.workoutType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedDay && (
            <GlassCard>
              <h3 className="font-bold text-foreground text-lg">
                {selectedDay.workoutType} Day
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedDay.exercises.length} exercises
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedDay.exercises.slice(0, 4).map((exercise) => (
                  <span
                    key={exercise.id}
                    className="text-xs bg-secondary px-2 py-1 rounded-lg text-secondary-foreground"
                  >
                    {exercise.name}
                  </span>
                ))}
              </div>
            </GlassCard>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!selectedDay || startMutation.isPending}
            onClick={() => void handleStart()}
          >
            {startMutation.isPending && <LoaderCircle className="animate-spin" />}
            Start Workout
          </Button>
        </>
      )}
    </div>
  );
};

export default WorkoutPage;
