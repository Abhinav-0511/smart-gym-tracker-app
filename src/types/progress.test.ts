import { describe, expect, it } from "vitest";

import {
  calculateProgressData,
  type ProgressWorkout,
} from "@/types/progress";

const workout = (
  id: string,
  workoutDate: string,
  weightKg: number,
  reps = 5,
): ProgressWorkout => ({
  id,
  workoutDate,
  startedAt: `${workoutDate}T10:00:00.000Z`,
  completedAt: `${workoutDate}T11:00:00.000Z`,
  sets: [{
    exerciseId: "bench",
    exerciseName: "Bench Press",
    reps,
    weightKg,
  }],
});

describe("progress aggregation", () => {
  it("derives frequency, volume, duration, strength, consistency, and trends", () => {
    const data = calculateProgressData(
      [
        workout("1", "2026-07-01", 100),
        workout("2", "2026-07-07", 102.5),
        workout("3", "2026-07-09", 105),
      ],
      [
        { date: "2026-07-01", weight: 82 },
        { date: "2026-07-09", weight: 80.5 },
      ],
      "2026-07-09",
    );

    expect(data.weeklyFrequency.at(-1)?.value).toBe(2);
    expect(data.monthlyFrequency.at(-1)?.value).toBe(3);
    expect(data.weeklyVolume.at(-1)?.value).toBe(1038);
    expect(data.averageWorkoutDurationMinutes).toBe(60);
    expect(data.bodyWeightChangeKg).toBe(-1.5);
    expect(data.consistencyPercent).toBeGreaterThan(0);
    expect(data.exerciseProgressions[0]).toMatchObject({
      exerciseId: "bench",
      exerciseName: "Bench Press",
    });
    expect(data.exerciseProgressions[0].points.at(-1)?.value).toBe(105);
  });

  it("returns meaningful empty progress data", () => {
    const data = calculateProgressData([], [], "2026-07-09");

    expect(data.bodyWeight).toEqual([]);
    expect(data.exerciseProgressions).toEqual([]);
    expect(data.averageWorkoutDurationMinutes).toBeNull();
    expect(data.consistencyPercent).toBe(0);
    expect(data.weeklyFrequency).toHaveLength(8);
    expect(data.monthlyFrequency).toHaveLength(6);
  });
});
