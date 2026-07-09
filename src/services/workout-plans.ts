import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";
import type {
  PlannedSetUpdate,
  WorkoutPlan,
} from "@/types/workout-plan";

function throwIfError(error: { message: string } | null): void {
  if (error) throw error;
}

export async function fetchWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
  const { data: planRows, error: plansError } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  throwIfError(plansError);

  if (!planRows?.length) return [];

  const planIds = planRows.map((plan) => plan.id);
  const { data: dayRows, error: daysError } = await supabase
    .from("workout_plan_days")
    .select("*")
    .in("workout_plan_id", planIds)
    .order("day_of_week", { ascending: true });

  throwIfError(daysError);

  const dayIds = dayRows?.map((day) => day.id) ?? [];
  const { data: exerciseRows, error: exercisesError } = dayIds.length
    ? await supabase
        .from("workout_plan_exercises")
        .select("*")
        .in("workout_plan_day_id", dayIds)
        .order("position", { ascending: true })
    : { data: [], error: null };

  throwIfError(exercisesError);

  const exerciseIds = exerciseRows?.map((exercise) => exercise.exercise_id) ?? [];
  const plannedExerciseIds = exerciseRows?.map((exercise) => exercise.id) ?? [];

  const [catalogResult, setsResult] = await Promise.all([
    exerciseIds.length
      ? supabase.from("exercise_catalog").select("*").in("id", exerciseIds)
      : Promise.resolve({ data: [], error: null }),
    plannedExerciseIds.length
      ? supabase
          .from("workout_plan_sets")
          .select("*")
          .in("workout_plan_exercise_id", plannedExerciseIds)
          .order("set_number", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  throwIfError(catalogResult.error);
  throwIfError(setsResult.error);

  const catalogById = new Map(
    catalogResult.data?.map((exercise) => [exercise.id, exercise]) ?? [],
  );
  const setsByExerciseId = new Map<
    string,
    Array<Tables<"workout_plan_sets">>
  >();

  for (const set of setsResult.data ?? []) {
    const sets = setsByExerciseId.get(set.workout_plan_exercise_id) ?? [];
    sets.push(set);
    setsByExerciseId.set(set.workout_plan_exercise_id, sets);
  }

  const exercisesByDayId = new Map<
    string,
    Array<Tables<"workout_plan_exercises">>
  >();

  for (const exercise of exerciseRows ?? []) {
    const exercises = exercisesByDayId.get(exercise.workout_plan_day_id) ?? [];
    exercises.push(exercise);
    exercisesByDayId.set(exercise.workout_plan_day_id, exercises);
  }

  const daysByPlanId = new Map<
    string,
    Array<Tables<"workout_plan_days">>
  >();

  for (const day of dayRows ?? []) {
    const days = daysByPlanId.get(day.workout_plan_id) ?? [];
    days.push(day);
    daysByPlanId.set(day.workout_plan_id, days);
  }

  return planRows.map((plan) => ({
    id: plan.id,
    name: plan.name,
    isActive: plan.is_active,
    days: (daysByPlanId.get(plan.id) ?? []).map((day) => ({
      id: day.id,
      dayOfWeek: day.day_of_week,
      workoutType: day.workout_type,
      isRestDay: day.is_rest_day,
      exercises: (exercisesByDayId.get(day.id) ?? []).map((plannedExercise) => {
        const catalogExercise = catalogById.get(plannedExercise.exercise_id);

        if (!catalogExercise) {
          throw new Error("A planned exercise references a missing catalog entry.");
        }

        return {
          id: plannedExercise.id,
          exerciseId: catalogExercise.id,
          name: catalogExercise.name,
          position: plannedExercise.position,
          usesBodyweight: catalogExercise.uses_bodyweight,
          sets: (setsByExerciseId.get(plannedExercise.id) ?? []).map((set) => ({
            id: set.id,
            setNumber: set.set_number,
            targetReps: set.target_reps,
            targetWeightKg: set.target_weight_kg,
          })),
        };
      }),
    })),
  }));
}

export async function createWorkoutPlan(
  userId: string,
  name: string,
): Promise<string> {
  void userId;
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("Plan name is required.");
  }

  const { data, error } = await supabase
    .rpc("create_workout_plan", { p_name: normalizedName });

  throwIfError(error);
  if (!data) throw new Error("The workout plan could not be created.");
  return data;
}

export async function createWorkoutPlanDay(
  planId: string,
  dayOfWeek: number,
  workoutType: string,
): Promise<string> {
  const normalizedType = workoutType.trim();
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    throw new Error("Choose a valid workout day.");
  }
  if (!normalizedType) {
    throw new Error("Workout type is required.");
  }

  const { data, error } = await supabase
    .from("workout_plan_days")
    .insert({
      workout_plan_id: planId,
      day_of_week: dayOfWeek,
      workout_type: normalizedType,
      is_rest_day: false,
    })
    .select("id")
    .single();

  if (error?.message.toLowerCase().includes("duplicate")) {
    throw new Error("That day is already part of this workout plan.");
  }
  throwIfError(error);
  if (!data) throw new Error("The workout day could not be created.");
  return data.id;
}

export async function updateWorkoutPlan(
  planId: string,
  updates: { name: string },
): Promise<void> {
  const { error } = await supabase
    .from("workout_plans")
    .update({ name: updates.name.trim() })
    .eq("id", planId);

  throwIfError(error);
}

export async function updateWorkoutPlanDay(
  dayId: string,
  updates: { workoutType: string; isRestDay: boolean },
): Promise<void> {
  const { error } = await supabase
    .from("workout_plan_days")
    .update({
      workout_type: updates.workoutType.trim(),
      is_rest_day: updates.isRestDay,
    })
    .eq("id", dayId);

  throwIfError(error);
}

export async function activateWorkoutPlan(
  userId: string,
  planId: string,
): Promise<void> {
  void userId;
  const { error } = await supabase.rpc("activate_workout_plan", {
    p_plan_id: planId,
  });
  throwIfError(error);
}

export async function addPlanExercise(
  dayId: string,
  exerciseId: string,
  allowDuplicate = false,
): Promise<void> {
  const { error } = await supabase.rpc("add_plan_exercise_with_sets", {
    p_day_id: dayId,
    p_exercise_id: exerciseId,
    p_allow_duplicate: allowDuplicate,
  });
  throwIfError(error);
}

export async function removePlanExercise(plannedExerciseId: string): Promise<void> {
  const { error } = await supabase
    .from("workout_plan_exercises")
    .delete()
    .eq("id", plannedExerciseId);

  throwIfError(error);
}

export async function reorderPlanExercises(
  dayId: string,
  orderedExerciseIds: string[],
): Promise<void> {
  if (new Set(orderedExerciseIds).size !== orderedExerciseIds.length) {
    throw new Error("Exercise ordering contains duplicate entries.");
  }

  const { error } = await supabase.rpc("reorder_plan_exercises", {
    p_day_id: dayId,
    p_ordered_ids: orderedExerciseIds,
  });
  throwIfError(error);
}

export async function updatePlanSet(
  setId: string,
  updates: PlannedSetUpdate,
): Promise<void> {
  const { error } = await supabase
    .from("workout_plan_sets")
    .update({
      ...(updates.targetReps === undefined
        ? {}
        : { target_reps: updates.targetReps }),
      ...(updates.targetWeightKg === undefined
        ? {}
        : { target_weight_kg: updates.targetWeightKg }),
    })
    .eq("id", setId);

  throwIfError(error);
}

export async function addPlanSet(plannedExerciseId: string): Promise<void> {
  const { error } = await supabase.rpc("add_plan_set", {
    p_plan_exercise_id: plannedExerciseId,
  });
  throwIfError(error);
}

export async function removePlanSet(setId: string): Promise<void> {
  const { error } = await supabase.rpc("remove_plan_set", {
    p_set_id: setId,
  });
  throwIfError(error);
}

export async function deleteWorkoutPlan(planId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_workout_plan", {
    p_plan_id: planId,
  });
  throwIfError(error);
}
