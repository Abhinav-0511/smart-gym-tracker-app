import { describe, expect, it } from "vitest";

import { getOverloadHint, groupMostRecentSetsByExercise } from "@/lib/progressive-overload";
import type { ExerciseHistoryPoint } from "@/types/personal-record";

describe("getOverloadHint", () => {
  it("suggests increasing weight when the top of the rep target is reached", () => {
    const hint = getOverloadHint(
      10,
      [{ reps: 12, weightKg: 60 }],
      [{ reps: 9, weightKg: 60 }],
    );
    expect(hint).toMatch(/increasing the weight/i);
  });

  it("gives a neutral note when performance drops versus last session", () => {
    const hint = getOverloadHint(
      10,
      [{ reps: 8, weightKg: 55 }],
      [{ reps: 10, weightKg: 60 }],
    );
    expect(hint).toMatch(/lower than last session/i);
    expect(hint).not.toMatch(/should|must|fail/i);
  });

  it("returns null when there is nothing worth surfacing", () => {
    expect(
      getOverloadHint(12, [{ reps: 8, weightKg: 60 }], [{ reps: 8, weightKg: 60 }]),
    ).toBeNull();
  });

  it("returns null without enough data", () => {
    expect(getOverloadHint(10, [], [{ reps: 8, weightKg: 60 }])).toBeNull();
    expect(getOverloadHint(10, [{ reps: 8, weightKg: 60 }], [])).toBeNull();
  });
});

describe("groupMostRecentSetsByExercise", () => {
  const point = (overrides: Partial<ExerciseHistoryPoint>): ExerciseHistoryPoint => ({
    sessionSetId: "set-1",
    exerciseId: "bench",
    exerciseName: "Bench Press",
    workoutDate: "2026-07-01",
    completedAt: "2026-07-01T10:00:00.000Z",
    reps: 10,
    weightKg: 60,
    ...overrides,
  });

  it("keeps only the most recent prior date per exercise, excluding today", () => {
    const history = [
      point({ sessionSetId: "a", workoutDate: "2026-07-01", completedAt: "2026-07-01T10:00:00.000Z" }),
      point({ sessionSetId: "b", workoutDate: "2026-07-01", completedAt: "2026-07-01T10:01:00.000Z" }),
      point({ sessionSetId: "c", workoutDate: "2026-06-24", completedAt: "2026-06-24T10:00:00.000Z" }),
      point({ sessionSetId: "d", workoutDate: "2026-07-08", completedAt: "2026-07-08T10:00:00.000Z" }),
    ];

    const grouped = groupMostRecentSetsByExercise(history, "2026-07-08");
    const benchSets = grouped.get("bench");

    expect(benchSets?.map((set) => set.sessionSetId)).toEqual(["a", "b"]);
  });
});
