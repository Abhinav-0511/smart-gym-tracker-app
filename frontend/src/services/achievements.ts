import { achievementDefinitions } from "@/data/achievements";
import { supabase } from "@/lib/supabase";
import {
  calculateAchievements,
  type AchievementData,
  type AchievementSourceData,
  type PersistedAchievement,
  type UserAchievement,
} from "@/types/achievement";

interface ReconciliationResult {
  data: AchievementData;
  newlyUnlocked: UserAchievement[];
}

async function fetchAchievementInputs(userId: string): Promise<{
  source: AchievementSourceData;
  persisted: PersistedAchievement[];
}> {
  const [workoutsResult, recordsResult, weightsResult, benchResult, unlocksResult] =
    await Promise.all([
      supabase
        .from("workout_sessions")
        .select("workout_date, completed_at")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("workout_date", { ascending: true })
        .order("completed_at", { ascending: true }),
      supabase
        .from("personal_records")
        .select("exercise_id, weight_kg, achieved_on")
        .eq("user_id", userId)
        .order("achieved_on", { ascending: true }),
      supabase
        .from("body_weight_entries")
        .select("recorded_on")
        .eq("user_id", userId)
        .order("recorded_on", { ascending: true }),
      supabase
        .from("exercise_catalog")
        .select("id")
        .eq("name", "Bench Press")
        .maybeSingle(),
      supabase
        .from("user_achievements")
        .select("id, achievement_key, unlocked_at")
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false }),
    ]);

  if (workoutsResult.error) throw workoutsResult.error;
  if (recordsResult.error) throw recordsResult.error;
  if (weightsResult.error) throw weightsResult.error;
  if (benchResult.error) throw benchResult.error;
  if (unlocksResult.error) throw unlocksResult.error;

  return {
    source: {
      workouts: (workoutsResult.data ?? [])
        .filter(
          (workout): workout is typeof workout & { completed_at: string } =>
            workout.completed_at !== null,
        )
        .map((workout) => ({
          workoutDate: workout.workout_date,
          completedAt: workout.completed_at,
        })),
      personalRecords: (recordsResult.data ?? []).map((record) => ({
        exerciseId: record.exercise_id,
        weightKg: Number(record.weight_kg),
        achievedOn: record.achieved_on,
      })),
      bodyWeightEntries: (weightsResult.data ?? []).map((entry) => ({
        recordedOn: entry.recorded_on,
      })),
      benchPressExerciseId: benchResult.data?.id ?? null,
    },
    persisted: (unlocksResult.data ?? []).map((row) => ({
      id: row.id,
      key: row.achievement_key,
      unlockedAt: row.unlocked_at,
    })),
  };
}

export async function fetchAchievements(userId: string): Promise<AchievementData> {
  const { source, persisted } = await fetchAchievementInputs(userId);
  return calculateAchievements(achievementDefinitions, source, persisted);
}

export async function reconcileAchievements(
  userId: string,
): Promise<ReconciliationResult> {
  const { source, persisted } = await fetchAchievementInputs(userId);
  const current = calculateAchievements(achievementDefinitions, source, persisted);
  const { data: insertedRows, error } = await supabase.rpc(
    "reconcile_achievements",
  );

  if (error) throw error;

  const insertedKeys = new Set((insertedRows ?? []).map((row) => row.achievement_key));
  const newlyUnlocked = current.achievements.filter((achievement) =>
    insertedKeys.has(achievement.key));
  const mergedPersisted: PersistedAchievement[] = [
    ...persisted,
    ...(insertedRows ?? []).map((row) => ({
      id: row.id,
      key: row.achievement_key,
      unlockedAt: row.unlocked_at,
    })),
  ];

  return {
    data: calculateAchievements(
      achievementDefinitions,
      source,
      mergedPersisted,
    ),
    newlyUnlocked,
  };
}
