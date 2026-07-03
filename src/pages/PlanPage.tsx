import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  Edit3,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import AddExerciseDialog from "@/components/plan/AddExerciseDialog";
import PlanExerciseEditor from "@/components/plan/PlanExerciseEditor";
import PlanTextDialog from "@/components/plan/PlanTextDialog";
import { Button } from "@/components/ui/button";
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
import {
  getWeekday,
  type PlannedSetUpdate,
} from "@/types/workout-plan";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Please try again.";
}

const PlanPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    plansQuery,
    catalogQuery,
    updatePlanMutation,
    updateDayMutation,
    activatePlanMutation,
    addExerciseMutation,
    removeExerciseMutation,
    reorderExercisesMutation,
    updateSetMutation,
    addSetMutation,
    removeSetMutation,
  } = useWorkoutPlans(user?.id);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [editDayOpen, setEditDayOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);

  const plans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);
  const activePlan = plans.find((plan) => plan.isActive) ?? null;
  const displayedPlan = activePlan ?? plans[0] ?? null;
  const selectedDay =
    displayedPlan?.days.find((day) => day.id === selectedDayId) ?? null;

  useEffect(() => {
    if (
      selectedDayId
      && !displayedPlan?.days.some((day) => day.id === selectedDayId)
    ) {
      setSelectedDayId(null);
    }
  }, [displayedPlan, selectedDayId]);

  const showMutationError = (title: string, error: unknown) => {
    toast({
      variant: "destructive",
      title,
      description: getErrorMessage(error),
    });
  };

  const handleActivatePlan = async (planId: string) => {
    try {
      await activatePlanMutation.mutateAsync(planId);
      setSelectedDayId(null);
      toast({ title: "Active plan updated" });
    } catch (error) {
      showMutationError("Couldn’t activate plan", error);
    }
  };

  const handleMoveExercise = async (fromIndex: number, toIndex: number) => {
    if (!selectedDay) return;

    const orderedExerciseIds = selectedDay.exercises.map((exercise) => exercise.id);
    const [movedExercise] = orderedExerciseIds.splice(fromIndex, 1);
    orderedExerciseIds.splice(toIndex, 0, movedExercise);

    try {
      await reorderExercisesMutation.mutateAsync({
        dayId: selectedDay.id,
        orderedExerciseIds,
      });
    } catch (error) {
      showMutationError("Couldn’t reorder exercises", error);
    }
  };

  const handleUpdateSet = async (setId: string, updates: PlannedSetUpdate) => {
    try {
      await updateSetMutation.mutateAsync({ setId, updates });
    } catch (error) {
      showMutationError("Couldn’t update planned set", error);
      throw error;
    }
  };

  const mutationPending =
    reorderExercisesMutation.isPending
    || removeExerciseMutation.isPending
    || updateSetMutation.isPending
    || addSetMutation.isPending
    || removeSetMutation.isPending;

  if (plansQuery.isPending) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading workout plan">
        <div className="h-16 rounded-2xl bg-secondary animate-pulse" />
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-20 rounded-2xl bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  if (plansQuery.isError) {
    return (
      <GlassCard className="text-center py-8">
        <AlertCircle className="text-destructive mx-auto mb-3" />
        <p className="font-semibold text-foreground">Couldn’t load your workout plans</p>
        <p className="text-sm text-muted-foreground mt-1">
          {getErrorMessage(plansQuery.error)}
        </p>
        <Button className="mt-4" onClick={() => void plansQuery.refetch()}>
          <RefreshCw size={16} />
          Retry
        </Button>
      </GlassCard>
    );
  }

  if (!displayedPlan) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workout Plan</h1>
          <p className="text-sm text-muted-foreground">Your weekly training schedule</p>
        </div>
        <GlassCard className="text-center py-10">
          <p className="font-semibold text-foreground">No workout plan yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first plan before adding training days and exercises.
          </p>
        </GlassCard>
      </div>
    );
  }

  const trainingDays = displayedPlan.days.filter((day) => !day.isRestDay).length;
  const planTypes = Array.from(
    new Set(
      displayedPlan.days
        .filter((day) => !day.isRestDay)
        .map((day) => day.workoutType),
    ),
  ).join(" / ");

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">
            {displayedPlan.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {planTypes || "Workout Plan"} · {trainingDays} training days
          </p>
        </div>
        <Button variant="glass" size="sm" onClick={() => setEditPlanOpen(true)}>
          <Edit3 size={14} />
          Edit
        </Button>
      </div>

      {plans.length > 1 && (
        <Select
          value={activePlan?.id}
          onValueChange={(planId) => void handleActivatePlan(planId)}
          disabled={activatePlanMutation.isPending}
        >
          <SelectTrigger aria-label="Active workout plan">
            <SelectValue placeholder="Choose active plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!activePlan && (
        <GlassCard className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">This plan is not active.</p>
          <Button
            size="sm"
            disabled={activatePlanMutation.isPending}
            onClick={() => void handleActivatePlan(displayedPlan.id)}
          >
            Activate
          </Button>
        </GlassCard>
      )}

      {!selectedDay ? (
        <div className="space-y-3">
          {displayedPlan.days.map((day) => {
            const weekday = getWeekday(day.dayOfWeek);

            return (
              <GlassCard
                key={day.id}
                hover={!day.isRestDay}
                className="group"
                onClick={() => !day.isRestDay && setSelectedDayId(day.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                      day.isRestDay
                        ? "bg-secondary text-muted-foreground"
                        : "bg-secondary text-foreground"
                    }`}>
                      {weekday.shortDay}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{day.workoutType}</h3>
                      <p className="text-xs text-muted-foreground">
                        {day.isRestDay
                          ? "Recovery day"
                          : `${day.exercises.length} exercises`}
                      </p>
                    </div>
                  </div>
                  {!day.isRestDay && (
                    <ChevronRight
                      size={18}
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                    />
                  )}
                </div>
              </GlassCard>
            );
          })}
          {!displayedPlan.days.length && (
            <GlassCard className="text-center text-sm text-muted-foreground py-8">
              This plan does not have any scheduled days yet.
            </GlassCard>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDayId(null)}>
            ← Back to Plan
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {getWeekday(selectedDay.dayOfWeek).day} — {selectedDay.workoutType}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedDay.exercises.length} exercises
              </p>
            </div>
            <Button variant="glass" size="sm" onClick={() => setEditDayOpen(true)}>
              <Edit3 size={14} />
              Edit
            </Button>
          </div>

          <div className="space-y-3">
            {selectedDay.exercises.map((exercise, index) => (
              <PlanExerciseEditor
                key={exercise.id}
                exercise={exercise}
                index={index}
                totalExercises={selectedDay.exercises.length}
                disabled={mutationPending}
                onMove={handleMoveExercise}
                onRemoveExercise={async (plannedExerciseId) => {
                  try {
                    await removeExerciseMutation.mutateAsync(plannedExerciseId);
                  } catch (error) {
                    showMutationError("Couldn’t remove exercise", error);
                  }
                }}
                onUpdateSet={handleUpdateSet}
                onAddSet={async (plannedExerciseId) => {
                  try {
                    await addSetMutation.mutateAsync(plannedExerciseId);
                  } catch (error) {
                    showMutationError("Couldn’t add set", error);
                  }
                }}
                onRemoveSet={async (setId) => {
                  try {
                    await removeSetMutation.mutateAsync(setId);
                  } catch (error) {
                    showMutationError("Couldn’t remove set", error);
                  }
                }}
              />
            ))}
          </div>

          {!selectedDay.exercises.length && (
            <GlassCard className="text-center text-sm text-muted-foreground">
              No exercises have been added to this day.
            </GlassCard>
          )}

          <Button
            variant="outline"
            className="w-full"
            disabled={catalogQuery.isPending || catalogQuery.isError}
            onClick={() => setAddExerciseOpen(true)}
          >
            {catalogQuery.isPending ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Add Exercise
          </Button>
          {catalogQuery.isError && (
            <div className="text-center">
              <p className="text-sm text-destructive">Couldn’t load the exercise catalog.</p>
              <Button variant="ghost" size="sm" onClick={() => void catalogQuery.refetch()}>
                <RefreshCw size={14} />
                Retry
              </Button>
            </div>
          )}
        </div>
      )}

      <PlanTextDialog
        open={editPlanOpen}
        title="Edit Workout Plan"
        description="Update the name shown for this training plan."
        label="Plan name"
        value={displayedPlan.name}
        saving={updatePlanMutation.isPending}
        onOpenChange={setEditPlanOpen}
        onSave={async (name) => {
          await updatePlanMutation.mutateAsync({ planId: displayedPlan.id, name });
        }}
      />

      {selectedDay && (
        <>
          <PlanTextDialog
            open={editDayOpen}
            title="Edit Training Day"
            description="Update the workout type for this day."
            label="Workout type"
            value={selectedDay.workoutType}
            saving={updateDayMutation.isPending}
            onOpenChange={setEditDayOpen}
            onSave={async (workoutType) => {
              await updateDayMutation.mutateAsync({
                dayId: selectedDay.id,
                workoutType,
                isRestDay: selectedDay.isRestDay,
              });
            }}
          />
          <AddExerciseDialog
            open={addExerciseOpen}
            catalog={catalogQuery.data ?? []}
            existingExerciseIds={selectedDay.exercises.map(
              (exercise) => exercise.exerciseId,
            )}
            saving={addExerciseMutation.isPending}
            onOpenChange={setAddExerciseOpen}
            onAdd={async (exerciseId) => {
              await addExerciseMutation.mutateAsync({
                dayId: selectedDay.id,
                exerciseId,
              });
            }}
          />
        </>
      )}
    </div>
  );
};

export default PlanPage;
