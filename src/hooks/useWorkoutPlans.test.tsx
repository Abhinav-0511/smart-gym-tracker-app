import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorkoutPlans } from "@/hooks/useWorkoutPlans";
import type { WorkoutPlan } from "@/types/workout-plan";

const serviceMocks = vi.hoisted(() => ({
  activateWorkoutPlan: vi.fn(),
  addPlanExercise: vi.fn(),
  addPlanSet: vi.fn(),
  deleteWorkoutPlan: vi.fn(),
  fetchExerciseCatalog: vi.fn(),
  fetchWorkoutPlans: vi.fn(),
  removePlanExercise: vi.fn(),
  removePlanSet: vi.fn(),
  reorderPlanExercises: vi.fn(),
  updatePlanSet: vi.fn(),
  updateWorkoutPlan: vi.fn(),
  updateWorkoutPlanDay: vi.fn(),
}));

vi.mock("@/services/workout-plans", () => serviceMocks);

const plans: WorkoutPlan[] = [
  {
    id: "plan-1",
    name: "Push Pull Legs",
    isActive: true,
    days: [
      {
        id: "day-1",
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
                id: "set-1",
                setNumber: 1,
                targetReps: 8,
                targetWeightKg: 80,
              },
            ],
          },
          {
            id: "planned-exercise-2",
            exerciseId: "exercise-2",
            name: "Overhead Press",
            position: 2,
            usesBodyweight: false,
            sets: [],
          },
        ],
      },
    ],
  },
  {
    id: "plan-2",
    name: "Full Body",
    isActive: false,
    days: [],
  },
];

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

describe("useWorkoutPlans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.fetchWorkoutPlans.mockResolvedValue(plans);
    serviceMocks.fetchExerciseCatalog.mockResolvedValue([]);
    serviceMocks.updateWorkoutPlan.mockResolvedValue(undefined);
    serviceMocks.updateWorkoutPlanDay.mockResolvedValue(undefined);
    serviceMocks.activateWorkoutPlan.mockResolvedValue(undefined);
    serviceMocks.addPlanExercise.mockResolvedValue(undefined);
    serviceMocks.removePlanExercise.mockResolvedValue(undefined);
    serviceMocks.reorderPlanExercises.mockResolvedValue(undefined);
    serviceMocks.updatePlanSet.mockResolvedValue(undefined);
    serviceMocks.addPlanSet.mockResolvedValue(undefined);
    serviceMocks.removePlanSet.mockResolvedValue(undefined);
    serviceMocks.deleteWorkoutPlan.mockResolvedValue(undefined);
  });

  it("loads the user’s plans", async () => {
    const { result } = renderHook(() => useWorkoutPlans("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.plansQuery.isSuccess).toBe(true));

    expect(result.current.plansQuery.data).toEqual(plans);
    expect(serviceMocks.fetchWorkoutPlans).toHaveBeenCalledWith("user-1");
  });

  it("edits a plan", async () => {
    const { result } = renderHook(() => useWorkoutPlans("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.plansQuery.isSuccess).toBe(true));
    await act(() =>
      result.current.updatePlanMutation.mutateAsync({
        planId: "plan-1",
        name: "Updated Plan",
      }),
    );

    expect(serviceMocks.updateWorkoutPlan).toHaveBeenCalledWith("plan-1", {
      name: "Updated Plan",
    });
  });

  it("reorders exercises", async () => {
    const { result } = renderHook(() => useWorkoutPlans("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.plansQuery.isSuccess).toBe(true));
    await act(() =>
      result.current.reorderExercisesMutation.mutateAsync({
        dayId: "day-1",
        orderedExerciseIds: ["planned-exercise-2", "planned-exercise-1"],
      }),
    );

    expect(serviceMocks.reorderPlanExercises).toHaveBeenCalledWith(
      "day-1",
      ["planned-exercise-2", "planned-exercise-1"],
    );
  });

  it("updates planned set targets", async () => {
    const { result } = renderHook(() => useWorkoutPlans("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.plansQuery.isSuccess).toBe(true));
    await act(() =>
      result.current.updateSetMutation.mutateAsync({
        setId: "set-1",
        updates: { targetReps: 10, targetWeightKg: 82.5 },
      }),
    );

    expect(serviceMocks.updatePlanSet).toHaveBeenCalledWith("set-1", {
      targetReps: 10,
      targetWeightKg: 82.5,
    });
  });

  it("switches the active plan", async () => {
    const { result } = renderHook(() => useWorkoutPlans("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.plansQuery.isSuccess).toBe(true));
    await act(() => result.current.activatePlanMutation.mutateAsync("plan-2"));

    expect(serviceMocks.activateWorkoutPlan).toHaveBeenCalledWith(
      "user-1",
      "plan-2",
    );
  });
});
