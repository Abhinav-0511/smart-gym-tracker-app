import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ResetPasswordPage from "@/pages/ResetPasswordPage";

const supabaseAuthMock = vi.hoisted(() => ({
  onAuthStateChange: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
}));

const updatePasswordMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: supabaseAuthMock,
  },
}));

vi.mock("@/services/auth", async () => {
  const actual = await vi.importActual<typeof import("@/services/auth")>("@/services/auth");

  return {
    ...actual,
    updatePassword: updatePasswordMock,
  };
});

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseAuthMock.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    supabaseAuthMock.getSession.mockResolvedValue({ data: { session: { user: {} } }, error: null });
    updatePasswordMock.mockResolvedValue(undefined);
  });

  it("shows a mismatch error before submitting a new password", async () => {
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(supabaseAuthMock.getSession).toHaveBeenCalled();
    });

    fireEvent.change(await screen.findByLabelText("New password"), { target: { value: "Password123" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "Different123" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });
});
