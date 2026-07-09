import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";
import { getLocalDateString } from "@/types/dashboard";
import type {
  StartWorkoutInput,
  WorkoutSession,
  WorkoutSetUpdate,
} from "@/types/workout-session";

type SupabaseLikeError = {
  code?: string;
  details?: string;
  hint?: string;
  message: string;
  status?: number;
};

function toError(error: SupabaseLikeError): Error {
  const normalized = new Error(error.message);
  Object.assign(normalized, error);
  return normalized;
}

function throwIfError(error: SupabaseLikeError | null): void {
  if (error) throw toError(error);
}

function isMissingFinalizeRpcError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = "code" in error ? String(error.code) : "";
  return (
    code === "PGRST202"
    || (
      /finalize_workout_session/i.test(error.message)
      && /could not find|not found|schema cache/i.test(error.message)
    )
  );
}

function isMissingWorkoutDateStartError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = "code" in error ? String(error.code) : "";
  return (
    code === "PGRST202"
    || (
      /start_workout_session/i.test(error.message)
      && /could not find|not found|schema cache/i.test(error.message)
    )
  );
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

export async function fetchCompletedWorkoutSessionForPlanDay(
  userId: string,
  planDayId: string,
  workoutDate: string,
  timezone: string,
): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("workout_plan_day_id", planDayId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10);

  throwIfError(error);
  const completedToday = (data ?? []).find(
    (session) =>
      session.workout_date === workoutDate
      || (
        session.completed_at
        && getLocalDateString(new Date(session.completed_at), timezone) === workoutDate
      ),
  );
  return completedToday ? hydrateSession(completedToday) : null;
}

export async function startWorkoutSession({
  userId,
  planDay,
  workoutDate,
}: StartWorkoutInput): Promise<WorkoutSession> {
  if (planDay.isRestDay) {
    throw new Error("A rest day cannot be started as a workout.");
  }

  const existingSession = await fetchActiveWorkoutSession(userId);
  if (existingSession) return existingSession;

  const startResult = await supabase.rpc("start_workout_session", {
    p_plan_day_id: planDay.id,
    p_workout_date: workoutDate,
  });
  const { data: sessionId, error: startError } =
    startResult.error && isMissingWorkoutDateStartError(toError(startResult.error))
      ? await supabase.rpc("start_workout_session", { p_plan_day_id: planDay.id })
      : startResult;
  throwIfError(startError);
  if (!sessionId) throw new Error("Workout session could not be created.");

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  throwIfError(sessionError);
  if (!session) throw new Error("Workout session could not be loaded.");
  return hydrateSession(session);
}

export async function updateWorkoutSessionSet(
  sessionId: string,
  setId: string,
  updates: WorkoutSetUpdate,
): Promise<void> {
  const { data, error } = await supabase.rpc("update_workout_session_set", {
    p_session_id: sessionId,
    p_set_id: setId,
    p_reps: updates.reps === undefined ? null : updates.reps,
    p_reps_provided: updates.reps !== undefined,
    p_weight_kg: updates.weightKg === undefined ? null : updates.weightKg,
    p_weight_provided: updates.weightKg !== undefined,
    p_is_completed: updates.isCompleted === undefined ? null : updates.isCompleted,
    p_completed_provided: updates.isCompleted !== undefined,
  });

  throwIfError(error);
  if (data !== true) throw new Error("Workout set could not be updated.");
}

export async function addWorkoutSessionSet(
  sessionId: string,
  sessionExerciseId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("add_workout_session_set", {
    p_session_id: sessionId,
    p_session_exercise_id: sessionExerciseId,
  });

  throwIfError(error);
  if (!data) throw new Error("Workout set could not be added.");
}

export async function removeWorkoutSessionSet(
  sessionId: string,
  setId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("remove_workout_session_set", {
    p_session_id: sessionId,
    p_set_id: setId,
  });

  throwIfError(error);
  if (data !== true) throw new Error("Workout set could not be removed.");
}

export async function updateWorkoutNotes(
  sessionId: string,
  notes: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("update_workout_session_notes", {
    p_session_id: sessionId,
    p_notes: notes,
  });

  throwIfError(error);
  if (data !== true) throw new Error("Workout notes could not be updated.");
}

async function closeWorkoutSession(
  sessionId: string,
  status: "completed" | "cancelled",
): Promise<void> {
  const { data, error } = await supabase.rpc("close_workout_session", {
    p_session_id: sessionId,
    p_status: status,
  });
  throwIfError(error);
  if (!data) throw new Error("This workout is already locked.");
}

type WorkoutCompletionInput = Pick<WorkoutSession, "id" | "exercises">;

async function completeSessionSets(session: WorkoutCompletionInput): Promise<void> {
  const incompleteSetsWithReps = session.exercises.flatMap((exercise) =>
    exercise.sets
      .filter((set) => !set.isCompleted && set.reps !== null)
      .map((set) => updateWorkoutSessionSet(session.id, set.id, {
        isCompleted: true,
      })),
  );

  await Promise.all(incompleteSetsWithReps);
}

export async function completeWorkoutSession(
  input: string | WorkoutCompletionInput,
): Promise<void> {
  const sessionId = typeof input === "string" ? input : input.id;

  if (typeof input !== "string") {
    await completeSessionSets(input);
  }

  try {
    await finalizeWorkoutSession(sessionId);
  } catch (error) {
    if (!isMissingFinalizeRpcError(error)) throw error;
    await closeWorkoutSession(sessionId, "completed");
    await verifyCompletedWorkoutSession(sessionId);
  }
}

async function finalizeWorkoutSession(sessionId: string): Promise<void> {
  const { data, error } = await supabase.rpc("finalize_workout_session", {
    p_session_id: sessionId,
  });

  throwIfError(error);
  if (
    !data
    || data.id !== sessionId
    || data.status !== "completed"
    || !data.completed_at
  ) {
    throw new Error("Workout completion could not be verified.");
  }
}

async function verifyCompletedWorkoutSession(sessionId: string): Promise<void> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, status, completed_at")
    .eq("id", sessionId)
    .maybeSingle();

  throwIfError(error);
  if (!data || data.status !== "completed" || !data.completed_at) {
    throw new Error("Workout completion could not be verified.");
  }
}

export function cancelWorkoutSession(sessionId: string): Promise<void> {
  return closeWorkoutSession(sessionId, "cancelled");
}

export async function addWorkoutSessionExercise(
  sessionId: string,
  exerciseId: string,
): Promise<void> {
  const { error } = await supabase.rpc("add_workout_session_exercise", {
    p_session_id: sessionId,
    p_exercise_id: exerciseId,
  });
  throwIfError(error);
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
