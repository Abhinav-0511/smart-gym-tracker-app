import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

import { getOrCreateProfile } from "@/services/profiles";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

describe("getOrCreateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a profile with a browser timezone when the profile is first created", async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "user-1",
          full_name: "Alex",
          timezone: "UTC",
        },
        error: null,
      });

    const upsert = vi.fn().mockResolvedValue({ error: null });

    supabaseMock.from.mockImplementation((table: string) => {
      if (table !== "profiles") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle,
        upsert,
      };
    });

    const user = {
      id: "user-1",
      email: "alex@example.com",
      user_metadata: { full_name: "Alex" },
    } as unknown as User;

    const profile = await getOrCreateProfile(user);

    expect(profile).toMatchObject({ id: "user-1" });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1",
        full_name: "Alex",
        timezone: expect.any(String),
      }),
      expect.objectContaining({ onConflict: "id", ignoreDuplicates: true }),
    );
  });
});
