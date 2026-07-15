import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  Edit3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import AddExerciseDialog from "@/components/plan/AddExerciseDialog";
import AddWorkoutDayDialog from "@/components/plan/AddWorkoutDayDialog";
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
    createExerciseMutation,
    createPlanMutation,
    createDayMutation,
    updatePlanMutation,
    updateDayMutation,
    activatePlanMutation,
    addExerciseMutation,
    removeExerciseMutation,
    reorderExercisesMutation,
    updateSetMutation,
    addSetMutation,
    removeSetMutation,
    deletePlanMutation,
    deleteDayMutation,
  } = useWorkoutPlans(user?.id);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [addDayOpen, setAddDayOpen] = useState(false);
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

  const handleDeletePlan = async () => {
    if (!displayedPlan || !window.confirm(`Delete “${displayedPlan.name}”?`)) {
      return;
    }

    try {
      await deletePlanMutation.mutateAsync(displayedPlan.id);
      setSelectedDayId(null);
      toast({ title: "Workout plan deleted" });
    } catch (error) {
      showMutationError("Couldn’t delete plan", error);
    }
  };

  const handleDeleteDay = async () => {
    if (!selectedDay || !window.confirm(`Delete “${selectedDay.workoutType}” from this plan?`)) {
      return;
    }

    try {
      await deleteDayMutation.mutateAsync(selectedDay.id);
      setSelectedDayId(null);
      toast({ title: "Workout day deleted" });
    } catch (error) {
      showMutationError("Couldn’t delete workout day", error);
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
    || removeSetMutation.isPending
    || deletePlanMutation.isPending
    || deleteDayMutation.isPending;

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
      <>
        <div className="space-y-5 animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Workout Plan</h1>
            <p className="text-sm text-muted-foreground">Your weekly training schedule</p>
          </div>
          <GlassCard className="text-center py-10">
            <p className="font-semibold text-foreground">No workout plan yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first plan, then add training days, exercises, and sets.
            </p>
            <Button className="mt-4" onClick={() => setCreatePlanOpen(true)}>
              <Plus size={16} />
              Create Plan
            </Button>
          </GlassCard>
        </div>
        <PlanTextDialog
          open={createPlanOpen}
          title="Create Workout Plan"
          description="Name your plan. Your first plan becomes active automatically."
          label="Plan name"
          value=""
          saving={createPlanMutation.isPending}
          onOpenChange={setCreatePlanOpen}
          onSave={async (name) => {
            await createPlanMutation.mutateAsync(name);
            toast({ title: "Workout plan created" });
          }}
        />
      </>
    );
  }

  const trainingDays = displayedPlan.days.filter((day) => !day.isRestDay).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            {displayedPlan.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {trainingDays} training days
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCreatePlanOpen(true)}>
            <Plus size={14} />
            New
          </Button>
          <Button variant="glass" size="sm" onClick={() => setEditPlanOpen(true)}>
            <Edit3 size={14} />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={deletePlanMutation.isPending}
            onClick={() => void handleDeletePlan()}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
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
            <GlassCard className="text-center py-8">
              <p className="font-medium text-foreground">No workout days yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a day to start building this plan.
              </p>
            </GlassCard>
          )}
          <Button
            variant="outline"
            className="w-full"
            disabled={displayedPlan.days.length >= 7}
            onClick={() => setAddDayOpen(true)}
          >
            <Plus size={16} />
            {displayedPlan.days.length >= 7 ? "All Days Added" : "Add Workout Day"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDayId(null)}>
            ← Back to Plan
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {getWeekday(selectedDay.dayOfWeek).day} — {selectedDay.workoutType}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedDay.exercises.length} exercises
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="glass" size="sm" onClick={() => setEditDayOpen(true)}>
                <Edit3 size={14} />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={deleteDayMutation.isPending}
                onClick={() => void handleDeleteDay()}
              >
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
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
        open={createPlanOpen}
        title="Create Workout Plan"
        description="Create another plan. You can activate it when you are ready."
        label="Plan name"
        value=""
        saving={createPlanMutation.isPending}
        onOpenChange={setCreatePlanOpen}
        onSave={async (name) => {
          await createPlanMutation.mutateAsync(name);
          setSelectedDayId(null);
          toast({ title: "Workout plan created" });
        }}
      />

      <AddWorkoutDayDialog
        open={addDayOpen}
        unavailableDays={displayedPlan.days.map((day) => day.dayOfWeek)}
        saving={createDayMutation.isPending}
        onOpenChange={setAddDayOpen}
        onAdd={async (dayOfWeek, workoutType) => {
          const dayId = await createDayMutation.mutateAsync({
            planId: displayedPlan.id,
            dayOfWeek,
            workoutType,
          });
          setSelectedDayId(dayId);
          toast({ title: "Workout day added" });
        }}
      />

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
            creating={createExerciseMutation.isPending}
            onOpenChange={setAddExerciseOpen}
            onCreate={(name) => createExerciseMutation.mutateAsync(name)}
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
