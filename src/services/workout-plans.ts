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
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("Plan name is required.");
  }

  const { data: existingPlans, error: existingPlansError } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("user_id", userId);

  throwIfError(existingPlansError);

  const { data, error } = await supabase
    .from("workout_plans")
    .insert({
      user_id: userId,
      name: normalizedName,
      is_active: !existingPlans?.length,
    })
    .select("id")
    .single();

  throwIfError(error);
  if (!data) throw new Error("The workout plan could not be created.");
  return data.id;
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
  const { data: currentActive, error: currentError } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  throwIfError(currentError);

  if (currentActive?.id === planId) return;

  if (currentActive) {
    const { error } = await supabase
      .from("workout_plans")
      .update({ is_active: false })
      .eq("id", currentActive.id);
    throwIfError(error);
  }

  const { error: activationError } = await supabase
    .from("workout_plans")
    .update({ is_active: true })
    .eq("id", planId)
    .eq("user_id", userId);

  if (activationError) {
    if (currentActive) {
      await supabase
        .from("workout_plans")
        .update({ is_active: true })
        .eq("id", currentActive.id);
    }
    throw activationError;
  }
}

export async function addPlanExercise(
  dayId: string,
  exerciseId: string,
  allowDuplicate = false,
): Promise<void> {
  if (!allowDuplicate) {
    const { data: duplicate, error: duplicateError } = await supabase
      .from("workout_plan_exercises")
      .select("id")
      .eq("workout_plan_day_id", dayId)
      .eq("exercise_id", exerciseId)
      .maybeSingle();

    throwIfError(duplicateError);

    if (duplicate) {
      throw new Error("This exercise is already part of the selected day.");
    }
  }

  const { data: lastExercise, error: positionError } = await supabase
    .from("workout_plan_exercises")
    .select("position")
    .eq("workout_plan_day_id", dayId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfError(positionError);

  const { data: plannedExercise, error: insertError } = await supabase
    .from("workout_plan_exercises")
    .insert({
      workout_plan_day_id: dayId,
      exercise_id: exerciseId,
      position: (lastExercise?.position ?? 0) + 1,
    })
    .select("id")
    .single();

  throwIfError(insertError);

  if (!plannedExercise) {
    throw new Error("The planned exercise could not be created.");
  }

  const { error: setsError } = await supabase.from("workout_plan_sets").insert(
    [1, 2, 3].map((setNumber) => ({
      workout_plan_exercise_id: plannedExercise.id,
      set_number: setNumber,
      target_reps: 10,
      target_weight_kg: null,
    })),
  );

  if (setsError) {
    await supabase
      .from("workout_plan_exercises")
      .delete()
      .eq("id", plannedExercise.id);
    throw setsError;
  }
}

export async function removePlanExercise(plannedExerciseId: string): Promise<void> {
  const { error } = await supabase
    .from("workout_plan_exercises")
    .delete()
    .eq("id", plannedExerciseId);

  throwIfError(error);
}

async function setExercisePositions(
  positions: Array<{ id: string; position: number }>,
): Promise<void> {
  for (const item of positions) {
    const { error } = await supabase
      .from("workout_plan_exercises")
      .update({ position: item.position })
      .eq("id", item.id);
    throwIfError(error);
  }
}

export async function reorderPlanExercises(
  dayId: string,
  orderedExerciseIds: string[],
): Promise<void> {
  if (new Set(orderedExerciseIds).size !== orderedExerciseIds.length) {
    throw new Error("Exercise ordering contains duplicate entries.");
  }

  const { data: currentExercises, error } = await supabase
    .from("workout_plan_exercises")
    .select("id, position")
    .eq("workout_plan_day_id", dayId)
    .order("position", { ascending: true });

  throwIfError(error);

  const currentIds = new Set(currentExercises?.map((exercise) => exercise.id) ?? []);
  if (
    currentIds.size !== orderedExerciseIds.length
    || orderedExerciseIds.some((id) => !currentIds.has(id))
  ) {
    throw new Error("Exercise ordering does not match the selected day.");
  }

  const maximumPosition = Math.max(
    0,
    ...(currentExercises ?? []).map((exercise) => exercise.position),
  );

  if (maximumPosition + orderedExerciseIds.length >= 32767) {
    throw new Error("Exercise positions cannot be safely reordered.");
  }

  const temporaryPositions = orderedExerciseIds.map((id, index) => ({
    id,
    position: maximumPosition + index + 1,
  }));
  const finalPositions = orderedExerciseIds.map((id, index) => ({
    id,
    position: index + 1,
  }));

  try {
    await setExercisePositions(temporaryPositions);
    await setExercisePositions(finalPositions);
  } catch (reorderError) {
    const originalPositions = (currentExercises ?? []).map((exercise) => ({
      id: exercise.id,
      position: exercise.position,
    }));

    try {
      await setExercisePositions(temporaryPositions);
      await setExercisePositions(originalPositions);
    } catch {
      // The next query refresh exposes any partial state instead of hiding it.
    }

    throw reorderError;
  }
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
  const { data: lastSet, error: setNumberError } = await supabase
    .from("workout_plan_sets")
    .select("set_number, target_reps, target_weight_kg")
    .eq("workout_plan_exercise_id", plannedExerciseId)
    .order("set_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfError(setNumberError);

  const { error } = await supabase.from("workout_plan_sets").insert({
    workout_plan_exercise_id: plannedExerciseId,
    set_number: (lastSet?.set_number ?? 0) + 1,
    target_reps: lastSet?.target_reps ?? 10,
    target_weight_kg: lastSet?.target_weight_kg ?? null,
  });

  throwIfError(error);
}

export async function removePlanSet(setId: string): Promise<void> {
  const { data: targetSet, error: targetError } = await supabase
    .from("workout_plan_sets")
    .select("workout_plan_exercise_id")
    .eq("id", setId)
    .single();

  throwIfError(targetError);

  if (!targetSet) {
    throw new Error("The planned set could not be found.");
  }

  const { error } = await supabase
    .from("workout_plan_sets")
    .delete()
    .eq("id", setId);

  throwIfError(error);

  const { data: remainingSets, error: remainingError } = await supabase
    .from("workout_plan_sets")
    .select("id, set_number")
    .eq("workout_plan_exercise_id", targetSet.workout_plan_exercise_id)
    .order("set_number", { ascending: true });

  throwIfError(remainingError);

  for (const [index, set] of (remainingSets ?? []).entries()) {
    if (set.set_number !== index + 1) {
      const { error: updateError } = await supabase
        .from("workout_plan_sets")
        .update({ set_number: index + 1 })
        .eq("id", set.id);
      throwIfError(updateError);
    }
  }
}

export async function deleteWorkoutPlan(planId: string): Promise<void> {
  const { error } = await supabase.from("workout_plans").delete().eq("id", planId);
  throwIfError(error);
}
