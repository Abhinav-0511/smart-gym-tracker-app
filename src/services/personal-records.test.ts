import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCompletedSetHistory } from "@/services/personal-records";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

describe("completed workout history source", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries completed sessions only", async () => {
    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.order.mockResolvedValue({ data: [], error: null });
    supabaseMock.from.mockReturnValue(chain);

    await expect(fetchCompletedSetHistory("user-1")).resolves.toEqual([]);

    expect(supabaseMock.from).toHaveBeenCalledWith("workout_sessions");
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(chain.eq).toHaveBeenCalledWith("status", "completed");
  });
});
