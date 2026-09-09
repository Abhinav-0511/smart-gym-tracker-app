import { describe, expect, it } from "vitest";

import { exportWorkoutPdf } from "@/lib/workout-pdf";
import type { DailyCheckin } from "@/types/checkin";
import type { WorkoutSession } from "@/types/workout-session";

const session: WorkoutSession = {
  id: "session-1",
  title: "Push Day",
  status: "completed",
  workoutDate: "2026-07-09",
  workoutPlanDayId: "day-1",
  notes: "Felt strong today.",
  startedAt: "2026-07-09T10:00:00.000Z",
  completedAt: "2026-07-09T11:00:00.000Z",
  exercises: [
    {
      id: "ex-1",
      exerciseId: "bench",
      name: "Bench Press",
      position: 1,
      usesBodyweight: false,
      sets: [
        {
          id: "set-1",
          setNumber: 1,
          reps: 10,
          weightKg: 60,
          isCompleted: true,
          completedAt: "2026-07-09T10:10:00.000Z",
          rir: 2,
          setType: "working",
        },
      ],
    },
  ],
};

const checkin: DailyCheckin = {
  id: "checkin-1",
  checkinDate: "2026-07-09",
  weightKg: 76,
  waistCm: 89,
  sleepHours: 7.5,
  steps: 8200,
  calories: 2200,
  proteinG: 145,
  waterLiters: 3,
  energy: 7,
  mood: 8,
  notes: "Good energy all day.",
};

describe("exportWorkoutPdf", () => {
  it("builds a PDF and triggers a save without throwing", () => {
    expect(() => exportWorkoutPdf(session)).not.toThrow();
  });

  it("includes the day's check-in details when provided", () => {
    expect(() => exportWorkoutPdf(session, checkin)).not.toThrow();
  });

  it("skips the check-in section gracefully when there is none", () => {
    expect(() => exportWorkoutPdf(session, null)).not.toThrow();
  });
});
