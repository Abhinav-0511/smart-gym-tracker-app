import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/pages/DashboardPage";

const dashboardMock = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    profile: {
      full_name: "Alex Johnson",
      timezone: "UTC",
    },
  }),
}));

vi.mock("@/hooks/useDashboard", () => ({
  useDashboard: () => dashboardMock.value,
}));

const refetch = vi.fn();
const aggregate = {
  totalCompletedWorkouts: 42,
  totalPRCount: 7,
  currentStreak: 3,
  longestStreak: 8,
  weeklyCompletedDays: 2,
  weeklyDays: [
    { date: "2026-07-06", dayOfWeek: 1, shortDay: "Mon", completed: true },
    { date: "2026-07-07", dayOfWeek: 2, shortDay: "Tue", completed: true },
    { date: "2026-07-08", dayOfWeek: 3, shortDay: "Wed", completed: false },
    { date: "2026-07-09", dayOfWeek: 4, shortDay: "Thu", completed: false },
    { date: "2026-07-10", dayOfWeek: 5, shortDay: "Fri", completed: false },
    { date: "2026-07-11", dayOfWeek: 6, shortDay: "Sat", completed: false },
    { date: "2026-07-12", dayOfWeek: 7, shortDay: "Sun", completed: false },
  ],
  lastWorkout: {
    id: "last-1",
    title: "Pull Day",
    workoutDate: "2026-07-07",
    durationMinutes: 55,
  },
  todayCompletedWorkout: null,
};

function makeDashboard(activeSession: object | null) {
  return {
    plansQuery: {
      data: [{
        id: "plan-1",
        name: "Push Pull Legs",
        isActive: true,
        days: [],
      }],
      refetch,
    },
    sessionQuery: { data: activeSession, refetch },
    recordsQuery: {
      data: {
        records: [{
          id: "pr-1",
          exerciseName: "Bench Press",
          achievedOn: "2026-07-07",
          weightKg: 100,
        }],
      },
      refetch,
    },
    aggregateQuery: { data: aggregate, refetch },
    isPending: false,
    error: null,
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    dashboardMock.value = makeDashboard(null);
  });

  it("renders database-derived statistics", () => {
    render(<DashboardPage onNavigate={vi.fn()} />);

    expect(screen.getByText("Alex Johnson 👋")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("3 days")).toBeInTheDocument();
    expect(screen.getByText("8 days")).toBeInTheDocument();
    expect(screen.getByText("100kg")).toBeInTheDocument();
    expect(screen.getByText(/55 min/)).toBeInTheDocument();
  });

  it("shows Continue Workout only for an in-progress session", () => {
    const onNavigate = vi.fn();
    dashboardMock.value = makeDashboard({
      id: "session-1",
      title: "Push Day",
      exercises: [],
    });

    render(<DashboardPage onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue Workout" }));
    expect(onNavigate).toHaveBeenCalledWith("workout");
    expect(screen.queryByRole("button", { name: "Start Workout" })).not.toBeInTheDocument();
  });

  it("shows Start Workout when no session is active", () => {
    render(<DashboardPage onNavigate={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Start Workout" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue Workout" })).not.toBeInTheDocument();
  });

  it("shows completed-today actions instead of Start Workout", () => {
    const onNavigate = vi.fn();
    dashboardMock.value = {
      ...makeDashboard(null),
      aggregateQuery: {
        data: {
          ...aggregate,
          todayCompletedWorkout: {
            id: "today-1",
            title: "Triceps Day",
            workoutDate: "2026-07-07",
            durationMinutes: 45,
          },
        },
        refetch,
      },
    };

    render(<DashboardPage onNavigate={onNavigate} />);

    expect(screen.getByText("Today's workout completed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start Workout" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "See History" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Review Workout" })[0]);
    expect(onNavigate).toHaveBeenCalledWith("workout");
  });
});
