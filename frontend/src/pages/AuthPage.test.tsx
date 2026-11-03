import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthPage from "@/pages/AuthPage";

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

const authServiceMocks = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    login: authMocks.login,
    signup: authMocks.signup,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/services/auth", async () => {
  const actual = await vi.importActual<typeof import("@/services/auth")>("@/services/auth");

  return {
    ...actual,
    requestPasswordReset: authServiceMocks.requestPasswordReset,
  };
});

describe("AuthPage", () => {
  beforeEach(() => {
    authMocks.login.mockReset();
    authMocks.signup.mockReset();
    authServiceMocks.requestPasswordReset.mockReset();
  });

  it("submits normalized login credentials once", async () => {
    authMocks.login.mockResolvedValue(undefined);
    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: " USER@Example.com " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.submit(screen.getByLabelText("Password").closest("form")!);

    await waitFor(() => {
      expect(authMocks.login).toHaveBeenCalledTimes(1);
      expect(authMocks.login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password",
      });
    });
  });

  it("blocks invalid email addresses before submitting", async () => {
    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.submit(screen.getByLabelText("Password").closest("form")!);

    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
    expect(authMocks.login).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a useful login error", async () => {
    authMocks.login.mockRejectedValue(new Error("Invalid login credentials"));
    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.submit(screen.getByLabelText("Password").closest("form")!);

    expect(
      await screen.findByText("The email or password you entered is incorrect."),
    ).toBeInTheDocument();
  });

  it("requests a password reset link for a valid email", async () => {
    authServiceMocks.requestPasswordReset.mockResolvedValue(undefined);
    render(<AuthPage />);

    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: " USER@Example.com " },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(
      await screen.findByText(/password reset link has been sent/i),
    ).toBeInTheDocument();
    expect(authServiceMocks.requestPasswordReset).toHaveBeenCalledWith("user@example.com");
  });

  it("handles signup that requires email confirmation", async () => {
    authMocks.signup.mockResolvedValue({ emailConfirmationRequired: true });
    render(<AuthPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "Alex Johnson" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(screen.getByText(/alex@example\.com/)).toBeInTheDocument();
    expect(authMocks.signup).toHaveBeenCalledWith({
      fullName: "Alex Johnson",
      email: "alex@example.com",
      password: "password",
    });
  });

  it("shows a clear duplicate-email signup error", async () => {
    authMocks.signup.mockRejectedValue(
      new Error("An account with this email already exists."),
    );
    render(<AuthPage />);

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "Alex Johnson" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByText("An account with this email already exists."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Check your email")).not.toBeInTheDocument();
  });
});
