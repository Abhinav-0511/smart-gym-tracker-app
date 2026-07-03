import { beforeEach, describe, expect, it, vi } from "vitest";

import { reconcileAchievements } from "@/services/achievements";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

function queryResult<T>(data: T) {
  const result = { data, error: null };
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
    then: (
      resolve: (value: typeof result) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue(result);
  return chain;
}

describe("achievement reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not persist an achievement twice", async () => {
    const workouts = queryResult([
      {
        workout_date: "2026-01-01",
        completed_at: "2026-01-01T10:00:00.000Z",
      },
    ]);
    const records = queryResult([]);
    const weights = queryResult([]);
    const bench = queryResult({ id: "bench" });
    const unlocks = queryResult([
      {
        id: "unlock-1",
        achievement_key: "first_workout",
        unlocked_at: "2026-01-01T10:00:00.000Z",
      },
    ]);
    const upsert = vi.fn();

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === "workout_sessions") return workouts;
      if (table === "personal_records") return records;
      if (table === "body_weight_entries") return weights;
      if (table === "exercise_catalog") return bench;
      if (table === "user_achievements") return { ...unlocks, upsert };
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await reconcileAchievements("user-1");

    expect(result.newlyUnlocked).toEqual([]);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("persists a newly qualified achievement with its historical date", async () => {
    const workouts = queryResult([
      {
        workout_date: "2026-01-01",
        completed_at: "2026-01-01T10:00:00.000Z",
      },
    ]);
    const records = queryResult([]);
    const weights = queryResult([]);
    const bench = queryResult({ id: "bench" });
    const unlocks = queryResult([]);
    const inserted = {
      data: [
        {
          id: "unlock-1",
          achievement_key: "first_workout",
          unlocked_at: "2026-01-01T10:00:00.000Z",
        },
      ],
      error: null,
    };
    const insertSelect = vi.fn().mockResolvedValue(inserted);
    const upsert = vi.fn().mockReturnValue({ select: insertSelect });

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === "workout_sessions") return workouts;
      if (table === "personal_records") return records;
      if (table === "body_weight_entries") return weights;
      if (table === "exercise_catalog") return bench;
      if (table === "user_achievements") return { ...unlocks, upsert };
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await reconcileAchievements("user-1");

    expect(upsert).toHaveBeenCalledWith(
      [
        {
          user_id: "user-1",
          achievement_key: "first_workout",
          unlocked_at: "2026-01-01T10:00:00.000Z",
        },
      ],
      {
        onConflict: "user_id,achievement_key",
        ignoreDuplicates: true,
      },
    );
    expect(result.newlyUnlocked.map(({ key }) => key)).toEqual(["first_workout"]);
  });
});
