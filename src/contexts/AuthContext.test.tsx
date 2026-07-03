import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";

const serviceMocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  loginWithPassword: vi.fn(),
  logoutSession: vi.fn(),
  signupWithPassword: vi.fn(),
  subscribeToAuthChanges: vi.fn(),
  getOrCreateProfile: vi.fn(),
  updateProfile: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("@/services/auth", () => ({
  getCurrentSession: serviceMocks.getCurrentSession,
  loginWithPassword: serviceMocks.loginWithPassword,
  logoutSession: serviceMocks.logoutSession,
  signupWithPassword: serviceMocks.signupWithPassword,
  subscribeToAuthChanges: serviceMocks.subscribeToAuthChanges,
}));

vi.mock("@/services/profiles", () => ({
  getOrCreateProfile: serviceMocks.getOrCreateProfile,
  updateProfile: serviceMocks.updateProfile,
}));

const session = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: {
    id: "user-id",
    app_metadata: {},
    user_metadata: { full_name: "Alex Johnson" },
    aud: "authenticated",
    created_at: "2026-07-03T00:00:00.000Z",
    email: "alex@example.com",
  },
} as Session;

const profile = {
  id: "user-id",
  full_name: "Alex Johnson",
  avatar_url: null,
  fitness_goal: null,
  experience_level: null,
  height_cm: null,
  timezone: "UTC",
  theme: "system",
  created_at: "2026-07-03T00:00:00.000Z",
  updated_at: "2026-07-03T00:00:00.000Z",
};

const profileUpdates = {
  full_name: "Updated Name",
  avatar_url: null,
  fitness_goal: "Build muscle",
  experience_level: "intermediate",
  height_cm: 178,
  timezone: "Asia/Calcutta",
  theme: "dark",
};

const updatedProfile = {
  ...profile,
  ...profileUpdates,
  updated_at: "2026-07-03T01:00:00.000Z",
};

const AuthProbe = () => {
  const {
    session: activeSession,
    profile: activeProfile,
    loading,
    logout,
    refreshProfile,
    updateProfile,
  } = useAuth();

  return (
    <div>
      <span>{loading ? "loading" : "ready"}</span>
      <span>{activeSession?.user.email ?? "signed-out"}</span>
      <span>{activeProfile?.full_name ?? "no-profile"}</span>
      <button onClick={() => void logout()}>Log out</button>
      <button onClick={() => void refreshProfile()}>Refresh profile</button>
      <button onClick={() => void updateProfile(profileUpdates).catch(() => undefined)}>
        Update profile
      </button>
    </div>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.subscribeToAuthChanges.mockReturnValue({
      unsubscribe: serviceMocks.unsubscribe,
    });
    serviceMocks.getOrCreateProfile.mockResolvedValue(profile);
    serviceMocks.updateProfile.mockResolvedValue(updatedProfile);
    serviceMocks.logoutSession.mockResolvedValue(undefined);
  });

  it("restores a persisted session and loads its profile", async () => {
    serviceMocks.getCurrentSession.mockResolvedValue(session);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("alex@example.com")).toBeInTheDocument();
    expect(screen.getByText("Alex Johnson")).toBeInTheDocument();
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(serviceMocks.getOrCreateProfile).toHaveBeenCalledWith(session.user);
  });

  it("clears session and profile after logout", async () => {
    serviceMocks.getCurrentSession.mockResolvedValue(session);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await screen.findByText("Alex Johnson");
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(serviceMocks.logoutSession).toHaveBeenCalledTimes(1);
      expect(screen.getByText("signed-out")).toBeInTheDocument();
      expect(screen.getByText("no-profile")).toBeInTheDocument();
    });
  });

  it("optimistically updates the profile and keeps the saved response", async () => {
    serviceMocks.getCurrentSession.mockResolvedValue(session);
    let resolveUpdate: (value: typeof updatedProfile) => void = () => undefined;
    serviceMocks.updateProfile.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await screen.findByText("Alex Johnson");
    fireEvent.click(screen.getByRole("button", { name: "Update profile" }));

    expect(await screen.findByText("Updated Name")).toBeInTheDocument();
    expect(serviceMocks.updateProfile).toHaveBeenCalledWith("user-id", profileUpdates);

    resolveUpdate(updatedProfile);
    await waitFor(() => {
      expect(screen.getByText("Updated Name")).toBeInTheDocument();
    });
  });

  it("rolls back an optimistic profile update when persistence fails", async () => {
    serviceMocks.getCurrentSession.mockResolvedValue(session);
    serviceMocks.updateProfile.mockRejectedValue(new Error("Update failed"));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await screen.findByText("Alex Johnson");
    fireEvent.click(screen.getByRole("button", { name: "Update profile" }));

    await waitFor(() => {
      expect(screen.getByText("Alex Johnson")).toBeInTheDocument();
      expect(screen.queryByText("Updated Name")).not.toBeInTheDocument();
    });
  });

  it("refreshes profile state from the backend", async () => {
    serviceMocks.getCurrentSession.mockResolvedValue(session);
    serviceMocks.getOrCreateProfile
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce(updatedProfile);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await screen.findByText("Alex Johnson");
    fireEvent.click(screen.getByRole("button", { name: "Refresh profile" }));

    expect(await screen.findByText("Updated Name")).toBeInTheDocument();
  });
});
