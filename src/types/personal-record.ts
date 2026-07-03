import type { ExerciseCatalogItem } from "@/types/workout-plan";

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  achievedOn: string;
  source: "auto" | "manual";
  workoutSessionSetId: string | null;
  previousWeightKg: number | null;
}

export interface LifetimeBest {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  achievedOn: string;
  previousWeightKg: number | null;
}

export interface ExerciseHistoryPoint {
  sessionSetId: string;
  exerciseId: string;
  exerciseName: string;
  workoutDate: string;
  completedAt: string;
  reps: number;
  weightKg: number;
}

export type AutoPRCandidate = ExerciseHistoryPoint;

export interface ExistingPRSnapshot {
  exerciseId: string;
  weightKg: number;
  achievedOn: string;
  sourceSetId: string | null;
  createdAt: string;
}

export interface ManualPRInput {
  exerciseId: string;
  weightKg: number;
  achievedOn: string;
}

export interface PersonalRecordsData {
  records: PersonalRecord[];
  lifetimeBests: LifetimeBest[];
  catalog: ExerciseCatalogItem[];
}

export function buildPRChartData(history: ExerciseHistoryPoint[]) {
  return history.map((point) => ({
    date: point.workoutDate,
    weight: point.weightKg,
    reps: point.reps,
  }));
}

export function findNewAutoPRs(
  candidates: AutoPRCandidate[],
  existingRecords: ExistingPRSnapshot[],
): AutoPRCandidate[] {
  const existingSetIds = new Set(
    existingRecords
      .map((record) => record.sourceSetId)
      .filter((id): id is string => id !== null),
  );
  const eventsByExercise = new Map<
    string,
    Array<
      | { kind: "existing"; weightKg: number; date: string; tieBreaker: string }
      | { kind: "candidate"; candidate: AutoPRCandidate; date: string; tieBreaker: string }
    >
  >();

  for (const record of existingRecords) {
    const events = eventsByExercise.get(record.exerciseId) ?? [];
    events.push({
      kind: "existing",
      weightKg: record.weightKg,
      date: record.achievedOn,
      tieBreaker: record.createdAt,
    });
    eventsByExercise.set(record.exerciseId, events);
  }

  for (const candidate of candidates) {
    if (existingSetIds.has(candidate.sessionSetId)) continue;

    const events = eventsByExercise.get(candidate.exerciseId) ?? [];
    events.push({
      kind: "candidate",
      candidate,
      date: candidate.workoutDate,
      tieBreaker: candidate.completedAt,
    });
    eventsByExercise.set(candidate.exerciseId, events);
  }

  const newRecords: AutoPRCandidate[] = [];

  for (const events of eventsByExercise.values()) {
    events.sort(
      (left, right) =>
        left.date.localeCompare(right.date)
        || left.tieBreaker.localeCompare(right.tieBreaker)
        || (left.kind === "existing" ? -1 : 1),
    );

    let lifetimeBest = -Infinity;
    for (const event of events) {
      if (event.kind === "existing") {
        lifetimeBest = Math.max(lifetimeBest, event.weightKg);
      } else if (event.candidate.weightKg > lifetimeBest) {
        newRecords.push(event.candidate);
        lifetimeBest = event.candidate.weightKg;
      }
    }
  }

  return newRecords;
}
