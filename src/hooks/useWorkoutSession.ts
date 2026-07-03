import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addWorkoutSessionExercise,
  cancelWorkoutSession,
  completeWorkoutSession,
  fetchActiveWorkoutSession,
  removeWorkoutSessionExercise,
  startWorkoutSession,
  updateWorkoutNotes,
  updateWorkoutSessionSet,
} from "@/services/workout-sessions";
import type {
  StartWorkoutInput,
  WorkoutSession,
  WorkoutSetUpdate,
} from "@/types/workout-session";

export const workoutSessionKeys = {
  active: (userId: string) => ["workout-session", "active", userId] as const,
};

export function useWorkoutSession(userId: string | undefined) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";
  const queryKey = workoutSessionKeys.active(resolvedUserId);

  const sessionQuery = useQuery({
    queryKey,
    queryFn: () => fetchActiveWorkoutSession(resolvedUserId),
    enabled: Boolean(userId),
    refetchOnWindowFocus: true,
  });

  const startMutation = useMutation({
    mutationFn: (input: Omit<StartWorkoutInput, "userId">) =>
      startWorkoutSession({ ...input, userId: resolvedUserId }),
    onSuccess: (session) => queryClient.setQueryData(queryKey, session),
  });

  const setMutation = useMutation({
    mutationFn: ({
      sessionId,
      setId,
      updates,
    }: {
      sessionId: string;
      setId: string;
      updates: WorkoutSetUpdate;
    }) => updateWorkoutSessionSet(sessionId, setId, updates),
    onMutate: async ({ setId, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSession = queryClient.getQueryData<WorkoutSession | null>(queryKey);

      queryClient.setQueryData<WorkoutSession | null>(queryKey, (session) => {
        if (!session) return session;

        return {
          ...session,
          exercises: session.exercises.map((exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === setId
                ? {
                    ...set,
                    ...(updates.reps === undefined ? {} : { reps: updates.reps }),
                    ...(updates.weightKg === undefined
                      ? {}
                      : { weightKg: updates.weightKg }),
                    ...(updates.isCompleted === undefined
                      ? {}
                      : {
                          isCompleted: updates.isCompleted,
                          completedAt: updates.isCompleted
                            ? new Date().toISOString()
                            : null,
                        }),
                  }
                : set,
            ),
          })),
        };
      });

      return { previousSession };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousSession ?? null);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const notesMutation = useMutation({
    mutationFn: ({ sessionId, notes }: { sessionId: string; notes: string }) =>
      updateWorkoutNotes(sessionId, notes),
    onMutate: async ({ notes }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSession = queryClient.getQueryData<WorkoutSession | null>(queryKey);
      queryClient.setQueryData<WorkoutSession | null>(queryKey, (session) =>
        session ? { ...session, notes } : session,
      );
      return { previousSession };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousSession ?? null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeWorkoutSession,
    onSuccess: () => queryClient.setQueryData(queryKey, null),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelWorkoutSession,
    onSuccess: () => queryClient.setQueryData(queryKey, null),
  });

  const addExerciseMutation = useMutation({
    mutationFn: ({
      sessionId,
      exerciseId,
    }: {
      sessionId: string;
      exerciseId: string;
    }) => addWorkoutSessionExercise(sessionId, exerciseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeExerciseMutation = useMutation({
    mutationFn: ({
      sessionId,
      sessionExerciseId,
    }: {
      sessionId: string;
      sessionExerciseId: string;
    }) => removeWorkoutSessionExercise(sessionId, sessionExerciseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    sessionQuery,
    startMutation,
    setMutation,
    notesMutation,
    completeMutation,
    cancelMutation,
    addExerciseMutation,
    removeExerciseMutation,
  };
}
