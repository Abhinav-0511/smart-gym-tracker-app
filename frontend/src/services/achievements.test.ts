import { beforeEach, describe, expect, it, vi } from "vitest";

import { reconcileAchievements } from "@/services/achievements";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
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
    supabaseMock.rpc.mockResolvedValue({ data: [], error: null });

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === "workout_sessions") return workouts;
      if (table === "personal_records") return records;
      if (table === "body_weight_entries") return weights;
      if (table === "exercise_catalog") return bench;
      if (table === "user_achievements") return unlocks;
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await reconcileAchievements("user-1");

    expect(result.newlyUnlocked).toEqual([]);
    expect(supabaseMock.rpc).toHaveBeenCalledWith("reconcile_achievements");
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
    supabaseMock.rpc.mockResolvedValue(inserted);

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === "workout_sessions") return workouts;
      if (table === "personal_records") return records;
      if (table === "body_weight_entries") return weights;
      if (table === "exercise_catalog") return bench;
      if (table === "user_achievements") return unlocks;
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await reconcileAchievements("user-1");

    expect(supabaseMock.rpc).toHaveBeenCalledWith("reconcile_achievements");
    expect(result.newlyUnlocked.map(({ key }) => key)).toEqual(["first_workout"]);
  });
});
