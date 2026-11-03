import type { ExerciseHistoryPoint } from "@/types/personal-record";

export interface SetPerformance {
  reps: number;
  weightKg: number;
}

/**
 * Neutral, non-shaming progressive-overload guidance. Never suggests a weight
 * change automatically — only surfaces a signal the user can act on. Returns
 * `null` when there isn't enough data to say anything useful.
 */
export function getOverloadHint(
  targetReps: number | null,
  currentWorkingSets: SetPerformance[],
  previousWorkingSets: SetPerformance[],
): string | null {
  const currentBest = bestSet(currentWorkingSets);
  const previousBest = bestSet(previousWorkingSets);
  if (!currentBest || !previousBest) return null;

  if (
    targetReps !== null
    && currentBest.reps >= targetReps
    && currentBest.weightKg >= previousBest.weightKg
  ) {
    return "You reached the top of your rep target. Consider increasing the weight next session.";
  }

  if (
    currentBest.weightKg < previousBest.weightKg
    || (currentBest.weightKg === previousBest.weightKg && currentBest.reps < previousBest.reps)
  ) {
    return "Performance was lower than last session. Recovery may be worth checking.";
  }

  return null;
}

function bestSet(sets: SetPerformance[]): SetPerformance | null {
  return sets.reduce<SetPerformance | null>((best, set) => {
    if (!best) return set;
    if (set.weightKg > best.weightKg) return set;
    if (set.weightKg === best.weightKg && set.reps > best.reps) return set;
    return best;
  }, null);
}

/**
 * For each exercise, the completed sets from the single most recent prior
 * workout date (excluding `excludeDate`, so an in-progress/same-day session
 * never compares against itself), ordered as they were performed.
 */
export function groupMostRecentSetsByExercise(
  history: ExerciseHistoryPoint[],
  excludeDate: string,
): Map<string, ExerciseHistoryPoint[]> {
  const byExercise = new Map<string, ExerciseHistoryPoint[]>();
  for (const point of history) {
    if (point.workoutDate === excludeDate) continue;
    const points = byExercise.get(point.exerciseId) ?? [];
    points.push(point);
    byExercise.set(point.exerciseId, points);
  }

  const mostRecent = new Map<string, ExerciseHistoryPoint[]>();
  for (const [exerciseId, points] of byExercise) {
    points.sort(
      (a, b) =>
        b.workoutDate.localeCompare(a.workoutDate) || b.completedAt.localeCompare(a.completedAt),
    );
    const mostRecentDate = points[0].workoutDate;
    mostRecent.set(
      exerciseId,
      points
        .filter((point) => point.workoutDate === mostRecentDate)
        .sort((a, b) => a.completedAt.localeCompare(b.completedAt)),
    );
  }
  return mostRecent;
}
