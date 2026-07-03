import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createWorkoutPlan,
  createWorkoutPlanDay,
} from "@/services/workout-plans";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

function existingPlansQuery(plans: Array<{ id: string }>) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockResolvedValue({ data: plans, error: null });
  return chain;
}

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
    const existing = existingPlansQuery([]);
    const insert = insertQuery("plan-1");
    supabaseMock.from
      .mockReturnValueOnce(existing)
      .mockReturnValueOnce(insert);

    await expect(createWorkoutPlan("user-1", "My Plan")).resolves.toBe("plan-1");
    expect(insert.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      name: "My Plan",
      is_active: true,
    });
  });

  it("leaves additional plans inactive for explicit switching", async () => {
    const existing = existingPlansQuery([{ id: "plan-1" }]);
    const insert = insertQuery("plan-2");
    supabaseMock.from
      .mockReturnValueOnce(existing)
      .mockReturnValueOnce(insert);

    await createWorkoutPlan("user-1", "Second Plan");

    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
    );
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
