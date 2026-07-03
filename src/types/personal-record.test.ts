import { describe, expect, it } from "vitest";

import {
  buildPRChartData,
  findNewAutoPRs,
  type AutoPRCandidate,
  type ExistingPRSnapshot,
} from "@/types/personal-record";

const candidate = (
  sessionSetId: string,
  weightKg: number,
  workoutDate: string,
): AutoPRCandidate => ({
  sessionSetId,
  exerciseId: "bench",
  exerciseName: "Bench Press",
  workoutDate,
  completedAt: `${workoutDate}T10:00:00.000Z`,
  reps: 5,
  weightKg,
});

describe("personal record derivation", () => {
  it("detects only progressive lifetime bests", () => {
    const result = findNewAutoPRs(
      [
        candidate("set-1", 80, "2026-01-01"),
        candidate("set-2", 85, "2026-01-02"),
        candidate("set-3", 82.5, "2026-01-03"),
      ],
      [],
    );

    expect(result.map((record) => record.sessionSetId)).toEqual(["set-1", "set-2"]);
  });

  it("uses manual records as a previous-best baseline", () => {
    const existing: ExistingPRSnapshot[] = [{
      exerciseId: "bench",
      weightKg: 82.5,
      achievedOn: "2025-12-31",
      sourceSetId: null,
      createdAt: "2025-12-31T10:00:00.000Z",
    }];

    const result = findNewAutoPRs(
      [
        candidate("set-1", 80, "2026-01-01"),
        candidate("set-2", 85, "2026-01-02"),
      ],
      existing,
    );

    expect(result.map((record) => record.sessionSetId)).toEqual(["set-2"]);
  });

  it("does not recreate an automatic record when a session is replayed", () => {
    const existing: ExistingPRSnapshot[] = [{
      exerciseId: "bench",
      weightKg: 100,
      achievedOn: "2026-01-01",
      sourceSetId: "set-1",
      createdAt: "2026-01-01T10:00:00.000Z",
    }];

    expect(findNewAutoPRs([candidate("set-1", 100, "2026-01-01")], existing)).toEqual([]);
  });

  it("builds chart points from completed-set history", () => {
    expect(buildPRChartData([candidate("set-1", 100, "2026-01-01")])).toEqual([
      { date: "2026-01-01", weight: 100, reps: 5 },
    ]);
  });
});
