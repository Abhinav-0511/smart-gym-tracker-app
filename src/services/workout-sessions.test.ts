import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  completeWorkoutSession,
  updateWorkoutSessionSet,
} from "@/services/workout-sessions";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

describe("workout session locking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects edits after a session is completed", async () => {
    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.maybeSingle.mockResolvedValue({
      data: { status: "completed" },
      error: null,
    });
    supabaseMock.from.mockReturnValue(chain);

    await expect(
      updateWorkoutSessionSet("session-1", "set-1", { reps: 12 }),
    ).rejects.toThrow("locked");

    expect(supabaseMock.from).toHaveBeenCalledTimes(1);
    expect(supabaseMock.from).toHaveBeenCalledWith("workout_sessions");
  });

  it("closes a workout through the transactional database boundary", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: true, error: null });

    await expect(completeWorkoutSession("session-1")).resolves.toBeUndefined();
    expect(supabaseMock.rpc).toHaveBeenCalledWith("close_workout_session", {
      p_session_id: "session-1",
      p_status: "completed",
    });
  });
});
