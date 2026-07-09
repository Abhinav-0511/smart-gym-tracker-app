import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

const authState = vi.hoisted(() => ({
  value: {
    session: null as object | null,
    profile: null as object | null,
    loading: false,
    error: null as string | null,
    refreshProfile: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState.value,
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    authState.value = {
      session: null,
      profile: null,
      loading: false,
      error: null,
      refreshProfile: vi.fn(),
      logout: vi.fn(),
    };
  });

  it("redirects unauthenticated users to the public auth page", () => {
    render(
      <MemoryRouter
        initialEntries={["/"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Private application</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div>Public authentication</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Public authentication")).toBeInTheDocument();
    expect(screen.queryByText("Private application")).not.toBeInTheDocument();
  });

  it("renders the application for a session with a loaded profile", () => {
    authState.value = {
      ...authState.value,
      session: {},
      profile: {},
    };

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProtectedRoute>
          <div>Private application</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("Private application")).toBeInTheDocument();
  });

  it("shows the auth page for a protected route when the session is missing", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Private application</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div>Public authentication</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Public authentication")).toBeInTheDocument();
  });
});
