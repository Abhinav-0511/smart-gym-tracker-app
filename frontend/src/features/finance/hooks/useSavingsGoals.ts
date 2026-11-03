import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financeKeys } from "@/features/finance/hooks/keys";
import {
  adjustSavingsGoal,
  createSavingsGoal,
  deleteSavingsGoal,
  fetchSavingsGoals,
  updateSavingsGoal,
} from "@/features/finance/services/savings";
import type {
  CreateSavingsGoalInput,
  SavingsGoal,
  UpdateSavingsGoalInput,
} from "@/features/finance/types/savings";

export function useSavingsGoals(userId: string | undefined) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";

  const goalsQuery = useQuery({
    queryKey: financeKeys.savings(resolvedUserId),
    queryFn: () => fetchSavingsGoals(resolvedUserId),
    enabled: Boolean(userId),
    networkMode: "offlineFirst",
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: financeKeys.savings(resolvedUserId) });

  const createMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: (input: CreateSavingsGoalInput) =>
      createSavingsGoal(resolvedUserId, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: ({ id, input }: { id: string; input: UpdateSavingsGoalInput }) =>
      updateSavingsGoal(id, input),
    onSuccess: invalidate,
  });

  const adjustMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: ({ goal, delta }: { goal: SavingsGoal; delta: number }) =>
      adjustSavingsGoal(goal, delta),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: (id: string) => deleteSavingsGoal(id),
    onSuccess: invalidate,
  });

  return { goalsQuery, createMutation, updateMutation, adjustMutation, deleteMutation };
}
