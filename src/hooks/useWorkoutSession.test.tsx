import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import type { WorkoutPlanDay } from "@/types/workout-plan";
import type { WorkoutSession } from "@/types/workout-session";

const serviceMocks = vi.hoisted(() => ({
  addWorkoutSessionExercise: vi.fn(),
  cancelWorkoutSession: vi.fn(),
  completeWorkoutSession: vi.fn(),
  fetchActiveWorkoutSession: vi.fn(),
  removeWorkoutSessionExercise: vi.fn(),
  startWorkoutSession: vi.fn(),
  updateWorkoutNotes: vi.fn(),
  updateWorkoutSessionSet: vi.fn(),
}));

vi.mock("@/services/workout-sessions", () => serviceMocks);

const planDay: WorkoutPlanDay = {
  id: "plan-day-1",
  dayOfWeek: 1,
  workoutType: "Push",
  isRestDay: false,
  exercises: [
    {
      id: "planned-exercise-1",
      exerciseId: "exercise-1",
      name: "Bench Press",
      position: 1,
      usesBodyweight: false,
      sets: [
        {
          id: "planned-set-1",
          setNumber: 1,
          targetReps: 8,
          targetWeightKg: 80,
        },
      ],
    },
  ],
};

const session: WorkoutSession = {
  id: "session-1",
  title: "Push Day",
  status: "in_progress",
  workoutDate: "2026-07-03",
  workoutPlanDayId: "plan-day-1",
  notes: "",
  startedAt: "2026-07-03T04:00:00.000Z",
  completedAt: null,
  exercises: [
    {
      id: "session-exercise-1",
      exerciseId: "exercise-1",
      name: "Bench Press",
      position: 1,
      usesBodyweight: false,
      sets: [
        {
          id: "session-set-1",
          setNumber: 1,
          reps: 8,
          weightKg: 80,
          isCompleted: false,
          completedAt: null,
        },
      ],
    },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useWorkoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.fetchActiveWorkoutSession.mockResolvedValue(session);
    serviceMocks.startWorkoutSession.mockResolvedValue(session);
    serviceMocks.updateWorkoutSessionSet.mockResolvedValue(undefined);
    serviceMocks.updateWorkoutNotes.mockResolvedValue(undefined);
    serviceMocks.completeWorkoutSession.mockResolvedValue(undefined);
    serviceMocks.cancelWorkoutSession.mockResolvedValue(undefined);
    serviceMocks.addWorkoutSessionExercise.mockResolvedValue(undefined);
    serviceMocks.removeWorkoutSessionExercise.mockResolvedValue(undefined);
  });

  it("restores and resumes an in-progress workout after remount", async () => {
    const firstRender = renderHook(() => useWorkoutSession("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(firstRender.result.current.sessionQuery.data).toEqual(session),
    );
    firstRender.unmount();

    const secondRender = renderHook(() => useWorkoutSession("user-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() =>
      expect(secondRender.result.current.sessionQuery.data).toEqual(session),
    );

    expect(serviceMocks.fetchActiveWorkoutSession).toHaveBeenCalledWith("user-1");
  });

  it("starts from a plan template without mutating the template", async () => {
    serviceMocks.fetchActiveWorkoutSession.mockResolvedValue(null);
    const originalTemplate = structuredClone(planDay);
    const { result } = renderHook(() => useWorkoutSession("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.sessionQuery.isSuccess).toBe(true));
    await act(() => result.current.startMutation.mutateAsync({ planDay }));

    expect(serviceMocks.startWorkoutSession).toHaveBeenCalledWith({
      userId: "user-1",
      planDay,
    });
    expect(planDay).toEqual(originalTemplate);
  });

  it("autosaves actual set values", async () => {
    const { result } = renderHook(() => useWorkoutSession("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.sessionQuery.isSuccess).toBe(true));
    await act(() =>
      result.current.setMutation.mutateAsync({
        sessionId: "session-1",
        setId: "session-set-1",
        updates: { reps: 10, weightKg: 82.5, isCompleted: true },
      }),
    );

    expect(serviceMocks.updateWorkoutSessionSet).toHaveBeenCalledWith(
      "session-1",
      "session-set-1",
      { reps: 10, weightKg: 82.5, isCompleted: true },
    );
  });

  it("completes and removes the active draft from the cache", async () => {
    const { result } = renderHook(() => useWorkoutSession("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.sessionQuery.data).toEqual(session));
    await act(() => result.current.completeMutation.mutateAsync("session-1"));

    expect(serviceMocks.completeWorkoutSession).toHaveBeenCalledWith("session-1");
    await waitFor(() => expect(result.current.sessionQuery.data).toBeNull());
  });

  it("cancels and removes the active draft from the cache", async () => {
    const { result } = renderHook(() => useWorkoutSession("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.sessionQuery.data).toEqual(session));
    await act(() => result.current.cancelMutation.mutateAsync("session-1"));

    expect(serviceMocks.cancelWorkoutSession).toHaveBeenCalledWith("session-1");
    await waitFor(() => expect(result.current.sessionQuery.data).toBeNull());
  });
});
