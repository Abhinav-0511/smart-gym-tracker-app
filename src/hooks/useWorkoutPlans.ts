import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import {
  activateWorkoutPlan,
  addPlanExercise,
  addPlanSet,
  deleteWorkoutPlan,
  fetchExerciseCatalog,
  fetchWorkoutPlans,
  removePlanExercise,
  removePlanSet,
  reorderPlanExercises,
  updatePlanSet,
  updateWorkoutPlan,
  updateWorkoutPlanDay,
} from "@/services/workout-plans";
import type { PlannedSetUpdate, WorkoutPlan } from "@/types/workout-plan";

export const workoutPlanKeys = {
  all: ["workout-plans"] as const,
  list: (userId: string) => [...workoutPlanKeys.all, userId] as const,
  catalog: ["exercise-catalog"] as const,
};

function invalidatePlans(queryClient: QueryClient, userId: string) {
  return queryClient.invalidateQueries({
    queryKey: workoutPlanKeys.list(userId),
  });
}

export function useWorkoutPlans(userId: string | undefined) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";
  const queryKey = workoutPlanKeys.list(resolvedUserId);

  const plansQuery = useQuery({
    queryKey,
    queryFn: () => fetchWorkoutPlans(resolvedUserId),
    enabled: Boolean(userId),
  });

  const catalogQuery = useQuery({
    queryKey: workoutPlanKeys.catalog,
    queryFn: fetchExerciseCatalog,
    staleTime: 1000 * 60 * 30,
    enabled: Boolean(userId),
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ planId, name }: { planId: string; name: string }) =>
      updateWorkoutPlan(planId, { name }),
    onSuccess: () => invalidatePlans(queryClient, resolvedUserId),
  });

  const updateDayMutation = useMutation({
    mutationFn: ({
      dayId,
      workoutType,
      isRestDay,
    }: {
      dayId: string;
      workoutType: string;
      isRestDay: boolean;
    }) => updateWorkoutPlanDay(dayId, { workoutType, isRestDay }),
    onSuccess: () => invalidatePlans(queryClient, resolvedUserId),
  });

  const activatePlanMutation = useMutation({
    mutationFn: (planId: string) =>
      activateWorkoutPlan(resolvedUserId, planId),
    onSuccess: () => invalidatePlans(queryClient, resolvedUserId),
  });

  const addExerciseMutation = useMutation({
    mutationFn: ({
      dayId,
      exerciseId,
      allowDuplicate = false,
    }: {
      dayId: string;
      exerciseId: string;
      allowDuplicate?: boolean;
    }) => addPlanExercise(dayId, exerciseId, allowDuplicate),
    onSuccess: () => invalidatePlans(queryClient, resolvedUserId),
  });

  const removeExerciseMutation = useMutation({
    mutationFn: removePlanExercise,
    onSuccess: () => invalidatePlans(queryClient, resolvedUserId),
  });

  const reorderExercisesMutation = useMutation({
    mutationFn: ({
      dayId,
      orderedExerciseIds,
    }: {
      dayId: string;
      orderedExerciseIds: string[];
    }) => reorderPlanExercises(dayId, orderedExerciseIds),
    onMutate: async ({ dayId, orderedExerciseIds }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousPlans = queryClient.getQueryData<WorkoutPlan[]>(queryKey);

      queryClient.setQueryData<WorkoutPlan[]>(queryKey, (plans = []) =>
        plans.map((plan) => ({
          ...plan,
          days: plan.days.map((day) =>
            day.id === dayId
              ? {
                  ...day,
                  exercises: orderedExerciseIds
                    .map((id) => day.exercises.find((exercise) => exercise.id === id))
                    .filter((exercise) => exercise !== undefined)
                    .map((exercise, index) => ({
                      ...exercise,
                      position: index + 1,
                    })),
                }
              : day,
          ),
        })),
      );

      return { previousPlans };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(queryKey, context.previousPlans);
      }
    },
    onSettled: () => invalidatePlans(queryClient, resolvedUserId),
  });

  const updateSetMutation = useMutation({
    mutationFn: ({
      setId,
      updates,
    }: {
      setId: string;
      updates: PlannedSetUpdate;
    }) => updatePlanSet(setId, updates),
    onSuccess: () => invalidatePlans(queryClient, resolvedUserId),
  });

  const addSetMutation = useMutation({
    mutationFn: addPlanSet,
    onSuccess: () => invalidatePlans(queryClient, resolvedUserId),
  });

  const removeSetMutation = useMutation({
    mutationFn: removePlanSet,
    onSuccess: () => invalidatePlans(queryClient, resolvedUserId),
  });

  const deletePlanMutation = useMutation({
    mutationFn: deleteWorkoutPlan,
    onSuccess: () => invalidatePlans(queryClient, resolvedUserId),
  });

  return {
    plansQuery,
    catalogQuery,
    updatePlanMutation,
    updateDayMutation,
    activatePlanMutation,
    addExerciseMutation,
    removeExerciseMutation,
    reorderExercisesMutation,
    updateSetMutation,
    addSetMutation,
    removeSetMutation,
    deletePlanMutation,
  };
}
