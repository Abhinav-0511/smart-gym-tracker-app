import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteWorkoutPlan,
  deleteWorkoutPlanDay,
  reorderPlanExercises,
} from "@/services/workout-plans";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

describe("workout plan deletions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a plan via the database RPC", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: true, error: null });

    await expect(deleteWorkoutPlan("plan-1")).resolves.toBeUndefined();

    expect(supabaseMock.rpc).toHaveBeenCalledWith("delete_workout_plan", {
      p_plan_id: "plan-1",
    });
  });

  it("deletes a day via the plan-day table delete flow", async () => {
    const chain = {
      delete: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn(),
    };
    chain.delete.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    chain.maybeSingle.mockResolvedValue({ data: { id: "day-1" }, error: null });
    supabaseMock.from.mockReturnValue(chain);

    await expect(deleteWorkoutPlanDay("day-1")).resolves.toBeUndefined();

    expect(supabaseMock.from).toHaveBeenCalledWith("workout_plan_days");
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("id", "day-1");
  });

  it("rejects a reorder when the RPC reports that no changes were applied", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: false, error: null });

    await expect(
      reorderPlanExercises("day-1", ["exercise-1", "exercise-2"]),
    ).rejects.toThrow("could not be reordered");
  });

  it("sends the complete ordered id list to the reorder RPC", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: true, error: null });

    await expect(
      reorderPlanExercises("day-1", ["exercise-2", "exercise-1"]),
    ).resolves.toBeUndefined();

    expect(supabaseMock.rpc).toHaveBeenCalledWith("reorder_plan_exercises", {
      p_day_id: "day-1",
      p_ordered_ids: ["exercise-2", "exercise-1"],
    });
  });
});
