import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthErrorMessage, requestPasswordReset, signupWithPassword, updatePassword } from "@/services/auth";

const authMock = vi.hoisted(() => ({
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
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

  it("sends a password reset email for a normalized address", async () => {
    authMock.resetPasswordForEmail.mockResolvedValue({ error: null });

    await requestPasswordReset(" USER@Example.com ");

    expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({ redirectTo: expect.stringContaining("/reset-password") }),
    );
  });

  it("updates the password using the recovery session", async () => {
    authMock.updateUser.mockResolvedValue({ data: { user: {} }, error: null });

    await updatePassword("NewPassword123");

    expect(authMock.updateUser).toHaveBeenCalledWith({ password: "NewPassword123" });
  });

  it("returns a friendly network message for offline failures", () => {
    expect(getAuthErrorMessage(new Error("Failed to fetch"), "login")).toBe(
      "Unable to connect. Please check your internet connection and try again.",
    );
  });

  it("returns a validation message for invalid email errors", () => {
    expect(getAuthErrorMessage(new Error("Invalid email"), "signup")).toBe(
      "Please enter a valid email address.",
    );
  });
});
