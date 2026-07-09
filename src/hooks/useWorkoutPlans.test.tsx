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
  createWorkoutPlan: vi.fn(),
  createWorkoutPlanDay: vi.fn(),
  createExerciseCatalogItem: vi.fn(),
  deleteWorkoutPlan: vi.fn(),
  deleteWorkoutPlanDay: vi.fn(),
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
vi.mock("@/services/exercise-catalog", () => ({
  createExerciseCatalogItem: serviceMocks.createExerciseCatalogItem,
  fetchExerciseCatalog: serviceMocks.fetchExerciseCatalog,
}));

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
    serviceMocks.createWorkoutPlan.mockResolvedValue("plan-3");
    serviceMocks.createWorkoutPlanDay.mockResolvedValue("day-2");
    serviceMocks.createExerciseCatalogItem.mockResolvedValue({
      id: "exercise-3",
      name: "Machine Chest Press",
      category: "other",
      equipment: null,
      usesBodyweight: false,
    });
    serviceMocks.removePlanExercise.mockResolvedValue(undefined);
    serviceMocks.reorderPlanExercises.mockResolvedValue(undefined);
    serviceMocks.updatePlanSet.mockResolvedValue(undefined);
    serviceMocks.addPlanSet.mockResolvedValue(undefined);
    serviceMocks.removePlanSet.mockResolvedValue(undefined);
    serviceMocks.deleteWorkoutPlan.mockResolvedValue(undefined);
    serviceMocks.deleteWorkoutPlanDay.mockResolvedValue(undefined);
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

  it("creates a plan and a workout day", async () => {
    const { result } = renderHook(() => useWorkoutPlans("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.plansQuery.isSuccess).toBe(true));
    await act(() => result.current.createPlanMutation.mutateAsync("New Plan"));
    await act(() =>
      result.current.createDayMutation.mutateAsync({
        planId: "plan-3",
        dayOfWeek: 1,
        workoutType: "Push",
      }),
    );

    expect(serviceMocks.createWorkoutPlan).toHaveBeenCalledWith(
      "user-1",
      "New Plan",
    );
    expect(serviceMocks.createWorkoutPlanDay).toHaveBeenCalledWith(
      "plan-3",
      1,
      "Push",
    );
  });

  it("creates an exercise and refreshes the shared catalog", async () => {
    const { result } = renderHook(() => useWorkoutPlans("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.catalogQuery.isSuccess).toBe(true));
    await act(() =>
      result.current.createExerciseMutation.mutateAsync("Machine Chest Press"),
    );

    expect(serviceMocks.createExerciseCatalogItem).toHaveBeenCalledWith(
      "Machine Chest Press",
    );
    expect(serviceMocks.fetchExerciseCatalog).toHaveBeenCalledTimes(2);
  });

  it("reorders exercises", async () => {
    const reorderedPlans: WorkoutPlan[] = [
      {
        ...plans[0],
        days: [
          {
            ...plans[0].days[0],
            exercises: [
              { ...plans[0].days[0].exercises[1], position: 1 },
              { ...plans[0].days[0].exercises[0], position: 2 },
            ],
          },
        ],
      },
      plans[1],
    ];
    serviceMocks.fetchWorkoutPlans
      .mockResolvedValueOnce(plans)
      .mockResolvedValue(reorderedPlans);

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
    await waitFor(() =>
      expect(
        result.current.plansQuery.data?.[0].days[0].exercises.map(
          (exercise) => exercise.id,
        ),
      ).toEqual(["planned-exercise-2", "planned-exercise-1"]),
    );
  });

  it("rolls a failed exercise reorder back", async () => {
    serviceMocks.reorderPlanExercises.mockRejectedValueOnce(
      new Error("Reorder failed"),
    );
    const { result } = renderHook(() => useWorkoutPlans("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.plansQuery.data).toEqual(plans));
    await expect(
      act(() =>
        result.current.reorderExercisesMutation.mutateAsync({
          dayId: "day-1",
          orderedExerciseIds: ["planned-exercise-2", "planned-exercise-1"],
        }),
      ),
    ).rejects.toThrow("Reorder failed");

    await waitFor(() =>
      expect(
        result.current.plansQuery.data?.[0].days[0].exercises.map(
          (exercise) => exercise.id,
        ),
      ).toEqual(["planned-exercise-1", "planned-exercise-2"]),
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
