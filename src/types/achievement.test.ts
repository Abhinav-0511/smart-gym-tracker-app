import { describe, expect, it } from "vitest";

import { achievementDefinitions } from "@/data/achievements";
import { calculateAchievements } from "@/types/achievement";

const emptySource = {
  workouts: [],
  personalRecords: [],
  bodyWeightEntries: [],
  benchPressExerciseId: "bench",
};

describe("achievement calculation", () => {
  it("keeps achievements locked and reports progress when criteria are unmet", () => {
    const result = calculateAchievements(
      achievementDefinitions,
      {
        ...emptySource,
        workouts: [
          {
            workoutDate: "2026-01-01",
            completedAt: "2026-01-01T10:00:00.000Z",
          },
        ],
      },
      [],
    );

    expect(result.achievements.find(({ key }) => key === "first_workout")).toMatchObject({
      qualified: true,
      unlocked: false,
      progress: { current: 1, target: 1, percentage: 100 },
    });
    expect(result.achievements.find(({ key }) => key === "beast_mode")).toMatchObject({
      unlocked: false,
      progress: { current: 1, target: 100, percentage: 1 },
    });
  });

  it("detects historical streak, PR, strength, and tracking achievements", () => {
    const workouts = Array.from({ length: 7 }, (_, index) => ({
      workoutDate: `2026-01-0${index + 1}`,
      completedAt: `2026-01-0${index + 1}T10:00:00.000Z`,
    }));
    const personalRecords = Array.from({ length: 5 }, (_, index) => ({
      exerciseId: "bench",
      weightKg: 80 + index * 5,
      achievedOn: `2026-01-0${index + 1}`,
    }));

    const result = calculateAchievements(
      achievementDefinitions,
      {
        workouts,
        personalRecords,
        bodyWeightEntries: [{ recordedOn: "2026-01-02" }],
        benchPressExerciseId: "bench",
      },
      [],
    );
    const qualifiedKeys = result.achievements
      .filter(({ qualified }) => qualified)
      .map(({ key }) => key);

    expect(qualifiedKeys).toEqual(
      expect.arrayContaining([
        "first_workout",
        "week_warrior",
        "pr_crusher",
        "centurion",
        "tracking_started",
      ]),
    );
    expect(result.history).toEqual([]);
  });

  it("keeps a persisted achievement unlocked if source data later changes", () => {
    const result = calculateAchievements(achievementDefinitions, emptySource, [
      {
        id: "unlock-1",
        key: "centurion",
        unlockedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    expect(result.achievements.find(({ key }) => key === "centurion")).toMatchObject({
      unlocked: true,
      unlockedAt: "2026-01-01T00:00:00.000Z",
      progress: { current: 0 },
    });
  });
});
