import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  detectPersonalRecords,
  fetchCompletedSetHistory,
} from "@/services/personal-records";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
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

  it("delegates automatic record creation to the trusted database function", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: 2, error: null });

    await expect(detectPersonalRecords("user-1")).resolves.toBe(2);
    expect(supabaseMock.rpc).toHaveBeenCalledWith("reconcile_personal_records");
    expect(supabaseMock.rpc).not.toHaveBeenCalledWith(
      "reconcile_personal_records",
      expect.objectContaining({ user_id: "user-1" }),
    );
  });
});
