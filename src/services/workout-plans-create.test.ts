import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createWorkoutPlan,
  createWorkoutPlanDay,
} from "@/services/workout-plans";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

function insertQuery(id: string) {
  const chain = {
    insert: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
  };
  chain.insert.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.single.mockResolvedValue({ data: { id }, error: null });
  return chain;
}

describe("workout-plan creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("automatically activates a user's first plan", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: "plan-1", error: null });

    await expect(createWorkoutPlan("user-1", "My Plan")).resolves.toBe("plan-1");
    expect(supabaseMock.rpc).toHaveBeenCalledWith("create_workout_plan", {
      p_name: "My Plan",
    });
  });

  it("does not send a caller-controlled user id into plan creation", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: "plan-2", error: null });

    await createWorkoutPlan("user-1", "Second Plan");

    expect(supabaseMock.rpc).toHaveBeenCalledWith("create_workout_plan", {
      p_name: "Second Plan",
    });
  });

  it("creates an editable workout day on the selected plan", async () => {
    const insert = insertQuery("day-1");
    supabaseMock.from.mockReturnValue(insert);

    await expect(
      createWorkoutPlanDay("plan-1", 1, "Push"),
    ).resolves.toBe("day-1");
    expect(insert.insert).toHaveBeenCalledWith({
      workout_plan_id: "plan-1",
      day_of_week: 1,
      workout_type: "Push",
      is_rest_day: false,
    });
  });
});
