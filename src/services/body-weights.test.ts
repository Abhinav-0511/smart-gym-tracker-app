import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCurrentBodyWeight,
  upsertCurrentBodyWeight,
} from "@/services/body-weights";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

describe("body-weight service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the most recent body-weight entry", async () => {
    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    chain.maybeSingle.mockResolvedValue({
      data: { recorded_on: "2026-07-03", weight_kg: 79.5 },
      error: null,
    });
    supabaseMock.from.mockReturnValue(chain);

    await expect(fetchCurrentBodyWeight("user-1")).resolves.toEqual({
      recordedOn: "2026-07-03",
      weightKg: 79.5,
    });
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(chain.order).toHaveBeenCalledWith("recorded_on", { ascending: false });
  });

  it("upserts today's entry instead of duplicating body weight", async () => {
    const chain = {
      upsert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    chain.upsert.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    chain.single.mockResolvedValue({
      data: { recorded_on: "2026-07-03", weight_kg: 80 },
      error: null,
    });
    supabaseMock.from.mockReturnValue(chain);

    await upsertCurrentBodyWeight("user-1", {
      recordedOn: "2026-07-03",
      weightKg: 80,
    });

    expect(chain.upsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        recorded_on: "2026-07-03",
        weight_kg: 80,
      },
      { onConflict: "user_id,recorded_on" },
    );
  });
});
