import { beforeEach, describe, expect, it, vi } from "vitest";

import { signupWithPassword } from "@/services/auth";

const authMock = vi.hoisted(() => ({
  signUp: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: authMock,
  },
}));

describe("signupWithPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects Supabase's obfuscated duplicate-email response", async () => {
    authMock.signUp.mockResolvedValue({
      data: {
        user: {
          id: "obfuscated-user",
          identities: [],
        },
        session: null,
      },
      error: null,
    });

    await expect(
      signupWithPassword({
        fullName: "Alex",
        email: "existing@example.com",
        password: "password",
      }),
    ).rejects.toThrow("An account with this email already exists.");
  });

  it("preserves the confirmation flow for a newly created identity", async () => {
    authMock.signUp.mockResolvedValue({
      data: {
        user: {
          id: "new-user",
          identities: [{ id: "identity-1" }],
        },
        session: null,
      },
      error: null,
    });

    await expect(
      signupWithPassword({
        fullName: "Alex",
        email: "new@example.com",
        password: "password",
      }),
    ).resolves.toBeNull();
  });
});
