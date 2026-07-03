import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchProgressData } from "@/services/progress";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

describe("progress historical source", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads only completed sessions and body-weight entries", async () => {
    const sessionChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    sessionChain.select.mockReturnValue(sessionChain);
    sessionChain.eq.mockReturnValue(sessionChain);
    sessionChain.order.mockReturnValue(sessionChain);
    sessionChain.limit.mockResolvedValue({ data: [], error: null });

    const weightChain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    };
    weightChain.select.mockReturnValue(weightChain);
    weightChain.eq.mockReturnValue(weightChain);
    weightChain.order.mockResolvedValue({ data: [], error: null });

    supabaseMock.from.mockImplementation((table: string) =>
      table === "workout_sessions" ? sessionChain : weightChain,
    );

    await fetchProgressData("user-1", "UTC");

    expect(sessionChain.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(sessionChain.eq).toHaveBeenCalledWith("status", "completed");
    expect(supabaseMock.from).toHaveBeenCalledWith("body_weight_entries");
  });
});
