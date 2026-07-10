import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getLocalDateString } from "@/types/dashboard";
import { computeHabitStats } from "@/features/productivity/lib/habit-stats";
import {
  completeHabit,
  createHabit,
  deleteHabit,
  fetchHabits,
  setHabitStatus,
  undoHabitCompletion,
  updateHabit,
  type HabitWithHistory,
} from "@/features/productivity/services/habits";
import type {
  CreateHabitInput,
  HabitStatus,
  UpdateHabitInput,
} from "@/features/productivity/types/habit";

export const habitKeys = {
  all: ["habits"] as const,
  list: (userId: string, includeArchived: boolean) =>
    [...habitKeys.all, userId, { includeArchived }] as const,
};

interface ToggleCompletionVariables {
  habit: HabitWithHistory;
  dateKey: string;
  complete: boolean;
}

/** Recompute a habit's derived stats after an optimistic completion change. */
function applyOptimisticToggle(
  habit: HabitWithHistory,
  dateKey: string,
  complete: boolean,
): HabitWithHistory {
  const keys = new Set(habit.recentCompletedKeys);
  if (complete) keys.add(dateKey);
  else keys.delete(dateKey);

  const recentCompletedKeys = [...keys].sort();
  const totalCompletions = Math.max(0, habit.stats.totalCompletions + (complete ? 1 : -1));
  const lastCompletedOn = complete
    ? [...recentCompletedKeys].sort().at(-1) ?? habit.stats.lastCompletedOn
    : recentCompletedKeys.at(-1) ?? null;

  return {
    ...habit,
    recentCompletedKeys,
    stats: computeHabitStats({
      habit,
      completedKeys: recentCompletedKeys,
      todayKey: dateKey,
      totalCompletions,
      lastCompletedOn,
    }),
  };
}

export function useHabits(
  userId: string | undefined,
  timezone: string,
  includeArchived = false,
) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";
  const todayKey = getLocalDateString(new Date(), timezone);
  const listKey = habitKeys.list(resolvedUserId, includeArchived);

  const habitsQuery = useQuery({
    queryKey: listKey,
    queryFn: () => fetchHabits(resolvedUserId, todayKey, { includeArchived }),
    enabled: Boolean(userId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: habitKeys.all });

  const createMutation = useMutation({
    mutationFn: (input: CreateHabitInput) => createHabit(resolvedUserId, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ habitId, input }: { habitId: string; input: UpdateHabitInput }) =>
      updateHabit(habitId, input),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: ({ habitId, status }: { habitId: string; status: HabitStatus }) =>
      setHabitStatus(habitId, status),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (habitId: string) => deleteHabit(habitId),
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ habit, dateKey, complete }: ToggleCompletionVariables) =>
      complete
        ? completeHabit(resolvedUserId, habit.id, dateKey)
        : undoHabitCompletion(habit.id, dateKey),
    onMutate: async ({ habit, dateKey, complete }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<HabitWithHistory[]>(listKey);

      queryClient.setQueryData<HabitWithHistory[]>(listKey, (current) =>
        current?.map((item) =>
          item.id === habit.id ? applyOptimisticToggle(item, dateKey, complete) : item,
        ),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },
    onSettled: invalidate,
  });

  return {
    todayKey,
    habitsQuery,
    createMutation,
    updateMutation,
    statusMutation,
    deleteMutation,
    toggleMutation,
  };
}
