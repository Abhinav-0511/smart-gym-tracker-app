import { beforeEach, describe, expect, it, vi } from "vitest";

import { createExerciseCatalogItem } from "@/services/exercise-catalog";

const supabaseMock = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

describe("exercise catalog service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates through the constrained RPC and maps the returned catalog row", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "exercise-1",
        name: "Machine Chest Press",
        category: "other",
        equipment: null,
        uses_bodyweight: false,
        created_at: "2026-07-03T00:00:00.000Z",
        updated_at: "2026-07-03T00:00:00.000Z",
      },
      error: null,
    });
    supabaseMock.rpc.mockReturnValue({ single });

    await expect(
      createExerciseCatalogItem("Machine Chest Press"),
    ).resolves.toEqual({
      id: "exercise-1",
      name: "Machine Chest Press",
      category: "other",
      equipment: null,
      usesBodyweight: false,
    });
    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      "create_exercise_catalog_item",
      { p_name: "Machine Chest Press" },
    );
  });
});
