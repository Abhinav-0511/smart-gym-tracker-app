import { supabase } from "@/lib/supabase";
import type {
  ExerciseHistoryPoint,
  LifetimeBest,
  ManualPRInput,
  PersonalRecord,
  PersonalRecordsData,
} from "@/types/personal-record";

function throwIfError(error: { message: string } | null): void {
  if (error) throw error;
}

export async function fetchCompletedSetHistory(
  userId: string,
): Promise<ExerciseHistoryPoint[]> {
  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("id, workout_date, completed_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("workout_date", { ascending: true });

  throwIfError(sessionsError);
  if (!sessions?.length) return [];

  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const { data: exercises, error: exercisesError } = await supabase
    .from("workout_session_exercises")
    .select("id, workout_session_id, exercise_id")
    .in("workout_session_id", sessions.map((session) => session.id));

  throwIfError(exercisesError);
  if (!exercises?.length) return [];

  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const exerciseIds = Array.from(new Set(exercises.map((exercise) => exercise.exercise_id)));
  const [setsResult, catalogResult] = await Promise.all([
    supabase
      .from("workout_session_sets")
      .select("id, workout_session_exercise_id, reps, weight_kg, completed_at")
      .in("workout_session_exercise_id", exercises.map((exercise) => exercise.id))
      .eq("is_completed", true)
      .not("reps", "is", null)
      .not("weight_kg", "is", null),
    supabase
      .from("exercise_catalog")
      .select("id, name")
      .in("id", exerciseIds),
  ]);

  throwIfError(setsResult.error);
  throwIfError(catalogResult.error);

  const catalogById = new Map(
    catalogResult.data?.map((exercise) => [exercise.id, exercise.name]) ?? [],
  );

  return (setsResult.data ?? [])
    .flatMap((set): ExerciseHistoryPoint[] => {
      const exercise = exerciseById.get(set.workout_session_exercise_id);
      const session = exercise ? sessionById.get(exercise.workout_session_id) : null;
      const exerciseName = exercise ? catalogById.get(exercise.exercise_id) : null;

      if (
        !exercise
        || !session
        || !exerciseName
        || set.reps === null
        || set.weight_kg === null
        || !set.completed_at
        || !session.completed_at
      ) {
        return [];
      }

      return [{
        sessionSetId: set.id,
        exerciseId: exercise.exercise_id,
        exerciseName,
        workoutDate: session.workout_date,
        completedAt: set.completed_at,
        reps: set.reps,
        weightKg: set.weight_kg,
      }];
    })
    .sort(
      (left, right) =>
        left.workoutDate.localeCompare(right.workoutDate)
        || left.completedAt.localeCompare(right.completedAt),
    );
}

async function fetchRecordRows(userId: string) {
  const { data, error } = await supabase
    .from("personal_records")
    .select("*")
    .eq("user_id", userId)
    .order("achieved_on", { ascending: true })
    .order("created_at", { ascending: true });

  throwIfError(error);
  return data ?? [];
}

export async function detectPersonalRecords(userId: string): Promise<number> {
  void userId;
  const { data, error } = await supabase.rpc("reconcile_personal_records");
  throwIfError(error);
  return data ?? 0;
}

export async function fetchPersonalRecords(
  userId: string,
): Promise<PersonalRecordsData> {
  const [recordRows, catalogResult] = await Promise.all([
    fetchRecordRows(userId),
    supabase.from("exercise_catalog").select("*").order("name", { ascending: true }),
  ]);

  throwIfError(catalogResult.error);

  const catalog = (catalogResult.data ?? []).map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    equipment: exercise.equipment,
    usesBodyweight: exercise.uses_bodyweight,
  }));
  const catalogById = new Map(catalog.map((exercise) => [exercise.id, exercise.name]));
  const bestByExercise = new Map<string, number>();

  const chronologicalRecords = recordRows.map((record): PersonalRecord => {
    const previousWeightKg = bestByExercise.get(record.exercise_id) ?? null;
    bestByExercise.set(
      record.exercise_id,
      Math.max(previousWeightKg ?? -Infinity, record.weight_kg),
    );

    return {
      id: record.id,
      exerciseId: record.exercise_id,
      exerciseName: catalogById.get(record.exercise_id) ?? "Unknown Exercise",
      weightKg: record.weight_kg,
      achievedOn: record.achieved_on,
      source: record.source as "auto" | "manual",
      workoutSessionSetId: record.workout_session_set_id,
      previousWeightKg,
    };
  });

  const lifetimeBestByExercise = new Map<string, LifetimeBest>();
  for (const record of chronologicalRecords) {
    const current = lifetimeBestByExercise.get(record.exerciseId);
    if (!current || record.weightKg > current.weightKg) {
      lifetimeBestByExercise.set(record.exerciseId, {
        exerciseId: record.exerciseId,
        exerciseName: record.exerciseName,
        weightKg: record.weightKg,
        achievedOn: record.achievedOn,
        previousWeightKg: record.previousWeightKg,
      });
    }
  }

  return {
    records: chronologicalRecords.reverse(),
    lifetimeBests: Array.from(lifetimeBestByExercise.values()).sort(
      (left, right) => right.weightKg - left.weightKg,
    ),
    catalog,
  };
}

export async function fetchExerciseHistory(
  userId: string,
  exerciseId: string,
): Promise<ExerciseHistoryPoint[]> {
  const history = await fetchCompletedSetHistory(userId);
  return history.filter((point) => point.exerciseId === exerciseId);
}

export async function createManualPersonalRecord(
  userId: string,
  input: ManualPRInput,
): Promise<void> {
  const { data: duplicate, error: duplicateError } = await supabase
    .from("personal_records")
    .select("id")
    .eq("user_id", userId)
    .eq("exercise_id", input.exerciseId)
    .eq("weight_kg", input.weightKg)
    .eq("achieved_on", input.achievedOn)
    .eq("source", "manual")
    .maybeSingle();

  throwIfError(duplicateError);
  if (duplicate) throw new Error("This manual personal record already exists.");

  const { error } = await supabase.from("personal_records").insert({
    user_id: userId,
    exercise_id: input.exerciseId,
    weight_kg: input.weightKg,
    achieved_on: input.achievedOn,
    source: "manual",
    workout_session_set_id: null,
  });

  if ((error as { code?: string } | null)?.code === "23505") {
    throw new Error("This manual personal record already exists.");
  }
  throwIfError(error);
}

export async function updateManualPersonalRecord(
  recordId: string,
  input: ManualPRInput,
): Promise<void> {
  const { data, error } = await supabase
    .from("personal_records")
    .update({
      exercise_id: input.exerciseId,
      weight_kg: input.weightKg,
      achieved_on: input.achievedOn,
    })
    .eq("id", recordId)
    .eq("source", "manual")
    .select("id")
    .maybeSingle();

  if ((error as { code?: string } | null)?.code === "23505") {
    throw new Error("This manual personal record already exists.");
  }
  throwIfError(error);
  if (!data) throw new Error("Automatic records cannot be edited.");
}

export async function deleteManualPersonalRecord(recordId: string): Promise<void> {
  const { data, error } = await supabase
    .from("personal_records")
    .delete()
    .eq("id", recordId)
    .eq("source", "manual")
    .select("id")
    .maybeSingle();

  throwIfError(error);
  if (!data) throw new Error("Automatic records cannot be deleted.");
}
