import { describe, expect, it } from "vitest";

import {
  calculateDashboardWorkoutAggregate,
  getGreeting,
  type CompletedWorkoutRow,
} from "@/types/dashboard";

const workout = (
  id: string,
  workoutDate: string,
  startedAt = `${workoutDate}T10:00:00.000Z`,
  completedAt = `${workoutDate}T11:00:00.000Z`,
): CompletedWorkoutRow => ({
  id,
  title: `Workout ${id}`,
  workoutDate,
  startedAt,
  completedAt,
});

describe("dashboard workout aggregation", () => {
  it("calculates current/longest streaks, weekly consistency, and last workout", () => {
    const rows = [
      workout("1", "2026-06-28"),
      workout("2", "2026-06-29"),
      workout("3", "2026-06-30"),
      workout("4", "2026-07-01"),
      workout("5", "2026-07-07"),
      workout("6", "2026-07-08"),
      workout("7", "2026-07-09"),
    ];

    const result = calculateDashboardWorkoutAggregate(
      rows,
      12,
      "UTC",
      new Date("2026-07-09T12:00:00.000Z"),
      9,
    );

    expect(result.totalCompletedWorkouts).toBe(12);
    expect(result.totalPRCount).toBe(9);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(4);
    expect(result.weeklyCompletedDays).toBe(3);
    expect(result.lastWorkout).toMatchObject({
      id: "7",
      workoutDate: "2026-07-09",
      durationMinutes: 60,
    });
  });

  it("returns zero current streak when the latest workout is older than yesterday", () => {
    const result = calculateDashboardWorkoutAggregate(
      [workout("1", "2026-07-01")],
      1,
      "UTC",
      new Date("2026-07-09T12:00:00.000Z"),
    );

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
  });

  it("creates timezone-aware greetings", () => {
    const date = new Date("2026-07-09T06:00:00.000Z");
    expect(getGreeting(date, "Asia/Calcutta")).toBe("Good morning");
    expect(getGreeting(date, "America/New_York")).toBe("Good morning");
  });
});
