import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";
import type {
  StartWorkoutInput,
  WorkoutSession,
  WorkoutSetUpdate,
} from "@/types/workout-session";

function throwIfError(error: { message: string } | null): void {
  if (error) throw error;
}

async function assertSessionInProgress(sessionId: string): Promise<void> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("status")
    .eq("id", sessionId)
    .maybeSingle();

  throwIfError(error);

  if (!data || data.status !== "in_progress") {
    throw new Error("This workout is locked and can no longer be edited.");
  }
}

async function assertSetBelongsToSession(
  sessionId: string,
  setId: string,
): Promise<void> {
  const { data: set, error: setError } = await supabase
    .from("workout_session_sets")
    .select("workout_session_exercise_id")
    .eq("id", setId)
    .maybeSingle();

  throwIfError(setError);

  if (!set) throw new Error("Workout set not found.");

  const { data: exercise, error: exerciseError } = await supabase
    .from("workout_session_exercises")
    .select("workout_session_id")
    .eq("id", set.workout_session_exercise_id)
    .maybeSingle();

  throwIfError(exerciseError);

  if (exercise?.workout_session_id !== sessionId) {
    throw new Error("Workout set does not belong to this session.");
  }
}

async function hydrateSession(
  sessionRow: Tables<"workout_sessions">,
): Promise<WorkoutSession> {
  const { data: exerciseRows, error: exerciseError } = await supabase
    .from("workout_session_exercises")
    .select("*")
    .eq("workout_session_id", sessionRow.id)
    .order("position", { ascending: true });

  throwIfError(exerciseError);

  const sessionExerciseIds = exerciseRows?.map((exercise) => exercise.id) ?? [];
  const catalogIds = exerciseRows?.map((exercise) => exercise.exercise_id) ?? [];

  const [setsResult, catalogResult] = await Promise.all([
    sessionExerciseIds.length
      ? supabase
          .from("workout_session_sets")
          .select("*")
          .in("workout_session_exercise_id", sessionExerciseIds)
          .order("set_number", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    catalogIds.length
      ? supabase.from("exercise_catalog").select("*").in("id", catalogIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  throwIfError(setsResult.error);
  throwIfError(catalogResult.error);

  const catalogById = new Map(
    catalogResult.data?.map((exercise) => [exercise.id, exercise]) ?? [],
  );
  const setsByExerciseId = new Map<
    string,
    Array<Tables<"workout_session_sets">>
  >();

  for (const set of setsResult.data ?? []) {
    const sets = setsByExerciseId.get(set.workout_session_exercise_id) ?? [];
    sets.push(set);
    setsByExerciseId.set(set.workout_session_exercise_id, sets);
  }

  if (!sessionRow.started_at) {
    throw new Error("An in-progress workout is missing its start time.");
  }

  return {
    id: sessionRow.id,
    title: sessionRow.title,
    status: sessionRow.status as WorkoutSession["status"],
    workoutDate: sessionRow.workout_date,
    workoutPlanDayId: sessionRow.workout_plan_day_id,
    notes: sessionRow.notes ?? "",
    startedAt: sessionRow.started_at,
    completedAt: sessionRow.completed_at,
    exercises: (exerciseRows ?? []).map((sessionExercise) => {
      const catalogExercise = catalogById.get(sessionExercise.exercise_id);
      if (!catalogExercise) {
        throw new Error("A session exercise references a missing catalog entry.");
      }

      return {
        id: sessionExercise.id,
        exerciseId: sessionExercise.exercise_id,
        name: catalogExercise.name,
        position: sessionExercise.position,
        usesBodyweight: catalogExercise.uses_bodyweight,
        sets: (setsByExerciseId.get(sessionExercise.id) ?? []).map((set) => ({
          id: set.id,
          setNumber: set.set_number,
          reps: set.reps,
          weightKg: set.weight_kg,
          isCompleted: set.is_completed,
          completedAt: set.completed_at,
        })),
      };
    }),
  };
}

export async function fetchActiveWorkoutSession(
  userId: string,
): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .maybeSingle();

  throwIfError(error);
  return data ? hydrateSession(data) : null;
}

export async function startWorkoutSession({
  userId,
  planDay,
}: StartWorkoutInput): Promise<WorkoutSession> {
  if (planDay.isRestDay) {
    throw new Error("A rest day cannot be started as a workout.");
  }

  const existingSession = await fetchActiveWorkoutSession(userId);
  if (existingSession) return existingSession;

  const startedAt = new Date().toISOString();
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      workout_plan_day_id: planDay.id,
      title: `${planDay.workoutType} Day`,
      status: "in_progress",
      started_at: startedAt,
    })
    .select("*")
    .single();

  throwIfError(sessionError);
  if (!session) throw new Error("Workout session could not be created.");

  try {
    if (planDay.exercises.length) {
      const { data: sessionExercises, error: exerciseError } = await supabase
        .from("workout_session_exercises")
        .insert(
          planDay.exercises.map((exercise, index) => ({
            workout_session_id: session.id,
            exercise_id: exercise.exerciseId,
            workout_plan_exercise_id: exercise.id,
            position: index + 1,
          })),
        )
        .select("*");

      throwIfError(exerciseError);

      const sessionExerciseByTemplateId = new Map(
        (sessionExercises ?? []).map((exercise) => [
          exercise.workout_plan_exercise_id,
          exercise,
        ]),
      );
      const setRows = planDay.exercises.flatMap((exercise) => {
        const sessionExercise = sessionExerciseByTemplateId.get(exercise.id);
        if (!sessionExercise) {
          throw new Error("Workout exercises could not be copied.");
        }

        return exercise.sets.map((set) => ({
          workout_session_exercise_id: sessionExercise.id,
          set_number: set.setNumber,
          reps: set.targetReps,
          weight_kg: set.targetWeightKg,
          is_completed: false,
          completed_at: null,
        }));
      });

      if (setRows.length) {
        const { error: setError } = await supabase
          .from("workout_session_sets")
          .insert(setRows);
        throwIfError(setError);
      }
    }

    return hydrateSession(session);
  } catch (copyError) {
    await supabase.from("workout_sessions").delete().eq("id", session.id);
    throw copyError;
  }
}

export async function updateWorkoutSessionSet(
  sessionId: string,
  setId: string,
  updates: WorkoutSetUpdate,
): Promise<void> {
  await assertSessionInProgress(sessionId);
  await assertSetBelongsToSession(sessionId, setId);

  const completedAt =
    updates.isCompleted === undefined
      ? undefined
      : updates.isCompleted
        ? new Date().toISOString()
        : null;

  const { data, error } = await supabase
    .from("workout_session_sets")
    .update({
      ...(updates.reps === undefined ? {} : { reps: updates.reps }),
      ...(updates.weightKg === undefined ? {} : { weight_kg: updates.weightKg }),
      ...(updates.isCompleted === undefined
        ? {}
        : {
            is_completed: updates.isCompleted,
            completed_at: completedAt,
          }),
    })
    .eq("id", setId)
    .select("id")
    .maybeSingle();

  throwIfError(error);
  if (!data) throw new Error("Workout set could not be updated.");
}

export async function updateWorkoutNotes(
  sessionId: string,
  notes: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .update({ notes })
    .eq("id", sessionId)
    .eq("status", "in_progress")
    .select("id")
    .maybeSingle();

  throwIfError(error);
  if (!data) throw new Error("This workout is locked and can no longer be edited.");
}

async function closeWorkoutSession(
  sessionId: string,
  status: "completed" | "cancelled",
): Promise<void> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .update({
      status,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("status", "in_progress")
    .select("id")
    .maybeSingle();

  throwIfError(error);
  if (!data) throw new Error("This workout is already locked.");
}

export function completeWorkoutSession(sessionId: string): Promise<void> {
  return closeWorkoutSession(sessionId, "completed");
}

export function cancelWorkoutSession(sessionId: string): Promise<void> {
  return closeWorkoutSession(sessionId, "cancelled");
}

export async function addWorkoutSessionExercise(
  sessionId: string,
  exerciseId: string,
): Promise<void> {
  await assertSessionInProgress(sessionId);

  const { data: lastExercise, error: positionError } = await supabase
    .from("workout_session_exercises")
    .select("position")
    .eq("workout_session_id", sessionId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfError(positionError);

  const { data: exercise, error } = await supabase
    .from("workout_session_exercises")
    .insert({
      workout_session_id: sessionId,
      exercise_id: exerciseId,
      position: (lastExercise?.position ?? 0) + 1,
    })
    .select("id")
    .single();

  throwIfError(error);
  if (!exercise) throw new Error("Exercise could not be added.");

  const { error: setsError } = await supabase.from("workout_session_sets").insert(
    [1, 2, 3].map((setNumber) => ({
      workout_session_exercise_id: exercise.id,
      set_number: setNumber,
      reps: 10,
      weight_kg: null,
      is_completed: false,
    })),
  );

  if (setsError) {
    await supabase.from("workout_session_exercises").delete().eq("id", exercise.id);
    throw setsError;
  }
}

export async function removeWorkoutSessionExercise(
  sessionId: string,
  sessionExerciseId: string,
): Promise<void> {
  await assertSessionInProgress(sessionId);

  const { data, error } = await supabase
    .from("workout_session_exercises")
    .delete()
    .eq("id", sessionExerciseId)
    .eq("workout_session_id", sessionId)
    .select("id")
    .maybeSingle();

  throwIfError(error);
  if (!data) throw new Error("Exercise could not be removed.");
}
