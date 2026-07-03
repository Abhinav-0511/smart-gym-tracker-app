import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/types/dashboard";
import {
  calculateProgressData,
  type BodyWeightPoint,
  type ProgressData,
  type ProgressWorkout,
} from "@/types/progress";

function throwIfError(error: { message: string } | null): void {
  if (error) throw error;
}

export async function fetchProgressData(
  userId: string,
  timezone: string,
): Promise<ProgressData> {
  const [sessionsResult, bodyWeightResult] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, workout_date, started_at, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("workout_date", { ascending: true })
      .limit(1000),
    supabase
      .from("body_weight_entries")
      .select("recorded_on, weight_kg")
      .eq("user_id", userId)
      .order("recorded_on", { ascending: true }),
  ]);

  throwIfError(sessionsResult.error);
  throwIfError(bodyWeightResult.error);

  const sessions = sessionsResult.data ?? [];
  const sessionIds = sessions.map((session) => session.id);
  const { data: exercises, error: exercisesError } = sessionIds.length
    ? await supabase
        .from("workout_session_exercises")
        .select("id, workout_session_id, exercise_id")
        .in("workout_session_id", sessionIds)
    : { data: [], error: null };

  throwIfError(exercisesError);

  const sessionExerciseIds = exercises?.map((exercise) => exercise.id) ?? [];
  const catalogIds = Array.from(
    new Set(exercises?.map((exercise) => exercise.exercise_id) ?? []),
  );
  const [setsResult, catalogResult] = await Promise.all([
    sessionExerciseIds.length
      ? supabase
          .from("workout_session_sets")
          .select("workout_session_exercise_id, reps, weight_kg")
          .in("workout_session_exercise_id", sessionExerciseIds)
          .eq("is_completed", true)
          .not("reps", "is", null)
          .not("weight_kg", "is", null)
      : Promise.resolve({ data: [], error: null }),
    catalogIds.length
      ? supabase.from("exercise_catalog").select("id, name").in("id", catalogIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  throwIfError(setsResult.error);
  throwIfError(catalogResult.error);

  const sessionByExerciseId = new Map(
    (exercises ?? []).map((exercise) => [exercise.id, exercise]),
  );
  const catalogById = new Map(
    (catalogResult.data ?? []).map((exercise) => [exercise.id, exercise.name]),
  );
  const setsBySessionId = new Map<string, ProgressWorkout["sets"]>();

  for (const set of setsResult.data ?? []) {
    const exercise = sessionByExerciseId.get(set.workout_session_exercise_id);
    const exerciseName = exercise
      ? catalogById.get(exercise.exercise_id)
      : undefined;

    if (!exercise || !exerciseName || set.reps === null || set.weight_kg === null) {
      continue;
    }

    const sets = setsBySessionId.get(exercise.workout_session_id) ?? [];
    sets.push({
      exerciseId: exercise.exercise_id,
      exerciseName,
      reps: set.reps,
      weightKg: set.weight_kg,
    });
    setsBySessionId.set(exercise.workout_session_id, sets);
  }

  const workouts: ProgressWorkout[] = sessions.map((session) => ({
    id: session.id,
    workoutDate: session.workout_date,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    sets: setsBySessionId.get(session.id) ?? [],
  }));
  const bodyWeight: BodyWeightPoint[] = (bodyWeightResult.data ?? []).map(
    (entry) => ({
      date: entry.recorded_on,
      weight: entry.weight_kg,
    }),
  );

  return calculateProgressData(
    workouts,
    bodyWeight,
    getLocalDateString(new Date(), timezone),
  );
}
