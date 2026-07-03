export type AchievementKey =
  | "first_workout"
  | "beast_mode"
  | "week_warrior"
  | "iron_will"
  | "pr_crusher"
  | "centurion"
  | "tracking_started";

export type AchievementCategory =
  | "milestones"
  | "consistency"
  | "strength"
  | "tracking";

export type AchievementMetric =
  | "completedWorkouts"
  | "longestStreak"
  | "personalRecords"
  | "benchPressBestKg"
  | "bodyWeightEntries";

export interface AchievementDefinition {
  key: AchievementKey;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  metric: AchievementMetric;
  target: number;
  unit?: string;
}

export interface AchievementWorkout {
  workoutDate: string;
  completedAt: string;
}

export interface AchievementPersonalRecord {
  exerciseId: string;
  weightKg: number;
  achievedOn: string;
}

export interface AchievementBodyWeightEntry {
  recordedOn: string;
}

export interface PersistedAchievement {
  id: string;
  key: string;
  unlockedAt: string;
}

export interface AchievementSourceData {
  workouts: AchievementWorkout[];
  personalRecords: AchievementPersonalRecord[];
  bodyWeightEntries: AchievementBodyWeightEntry[];
  benchPressExerciseId: string | null;
}

export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
  unit?: string;
}

export interface UserAchievement {
  key: AchievementKey;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  qualified: boolean;
  qualifiedAt: string | null;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: AchievementProgress;
}

export interface AchievementData {
  achievements: UserAchievement[];
  history: UserAchievement[];
}

function dateDifferenceInDays(left: string, right: string): number {
  const leftDate = new Date(`${left}T00:00:00.000Z`);
  const rightDate = new Date(`${right}T00:00:00.000Z`);
  return Math.round((leftDate.getTime() - rightDate.getTime()) / 86_400_000);
}

function getStreakUnlockDates(workouts: AchievementWorkout[]): Map<number, string> {
  const firstCompletionByDate = new Map<string, string>();
  for (const workout of workouts) {
    const current = firstCompletionByDate.get(workout.workoutDate);
    if (!current || workout.completedAt < current) {
      firstCompletionByDate.set(workout.workoutDate, workout.completedAt);
    }
  }

  const dates = [...firstCompletionByDate.keys()].sort();
  const unlockDates = new Map<number, string>();
  let streak = 0;
  let previousDate: string | null = null;

  for (const date of dates) {
    streak =
      previousDate && dateDifferenceInDays(date, previousDate) === 1
        ? streak + 1
        : 1;
    if (!unlockDates.has(streak)) {
      unlockDates.set(streak, firstCompletionByDate.get(date) ?? `${date}T00:00:00.000Z`);
    }
    previousDate = date;
  }

  return unlockDates;
}

function findStreakUnlockDate(
  unlockDates: Map<number, string>,
  target: number,
): string | null {
  for (const [streak, unlockedAt] of unlockDates) {
    if (streak >= target) return unlockedAt;
  }
  return null;
}

export function calculateAchievements(
  definitions: readonly AchievementDefinition[],
  source: AchievementSourceData,
  persisted: PersistedAchievement[],
): AchievementData {
  const workouts = [...source.workouts].sort(
    (left, right) =>
      left.workoutDate.localeCompare(right.workoutDate)
      || left.completedAt.localeCompare(right.completedAt),
  );
  const personalRecords = [...source.personalRecords].sort(
    (left, right) => left.achievedOn.localeCompare(right.achievedOn),
  );
  const bodyWeightEntries = [...source.bodyWeightEntries].sort((left, right) =>
    left.recordedOn.localeCompare(right.recordedOn),
  );
  const uniqueWorkoutDates = [...new Set(workouts.map((workout) => workout.workoutDate))];
  const streakUnlockDates = getStreakUnlockDates(workouts);
  let longestStreak = 0;
  let runningStreak = 0;

  uniqueWorkoutDates.forEach((date, index) => {
    runningStreak =
      index > 0 && dateDifferenceInDays(date, uniqueWorkoutDates[index - 1]) === 1
        ? runningStreak + 1
        : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
  });

  const benchRecords = source.benchPressExerciseId
    ? personalRecords.filter(
        (record) => record.exerciseId === source.benchPressExerciseId,
      )
    : [];
  const benchPressBestKg = benchRecords.reduce(
    (best, record) => Math.max(best, record.weightKg),
    0,
  );
  const metricValues: Record<AchievementMetric, number> = {
    completedWorkouts: workouts.length,
    longestStreak,
    personalRecords: personalRecords.length,
    benchPressBestKg,
    bodyWeightEntries: bodyWeightEntries.length,
  };
  const persistedByKey = new Map(persisted.map((row) => [row.key, row]));

  const achievements = definitions.map<UserAchievement>((definition) => {
    const current = metricValues[definition.metric];
    const saved = persistedByKey.get(definition.key);
    let historicalUnlockAt: string | null = null;

    switch (definition.metric) {
      case "completedWorkouts":
        historicalUnlockAt =
          workouts[definition.target - 1]?.completedAt ?? null;
        break;
      case "longestStreak":
        historicalUnlockAt = findStreakUnlockDate(
          streakUnlockDates,
          definition.target,
        );
        break;
      case "personalRecords":
        historicalUnlockAt = personalRecords[definition.target - 1]
          ? `${personalRecords[definition.target - 1].achievedOn}T00:00:00.000Z`
          : null;
        break;
      case "benchPressBestKg": {
        const qualifyingRecord = benchRecords.find(
          (record) => record.weightKg >= definition.target,
        );
        historicalUnlockAt = qualifyingRecord
          ? `${qualifyingRecord.achievedOn}T00:00:00.000Z`
          : null;
        break;
      }
      case "bodyWeightEntries":
        historicalUnlockAt = bodyWeightEntries[definition.target - 1]
          ? `${bodyWeightEntries[definition.target - 1].recordedOn}T00:00:00.000Z`
          : null;
        break;
    }

    const unlockedAt = saved?.unlockedAt ?? null;
    return {
      key: definition.key,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      category: definition.category,
      qualified: Boolean(historicalUnlockAt),
      qualifiedAt: historicalUnlockAt,
      unlocked: Boolean(saved),
      unlockedAt,
      progress: {
        current: Math.min(current, definition.target),
        target: definition.target,
        percentage: Math.min(100, Math.round((current / definition.target) * 100)),
        unit: definition.unit,
      },
    };
  });

  return {
    achievements,
    history: achievements
      .filter(
        (achievement): achievement is UserAchievement & { unlockedAt: string } =>
          achievement.unlockedAt !== null,
      )
      .sort((left, right) => right.unlockedAt.localeCompare(left.unlockedAt)),
  };
}
