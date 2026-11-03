import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financeKeys } from "@/features/finance/hooks/keys";
import {
  createBudget,
  deleteBudget,
  fetchBudgets,
  updateBudget,
} from "@/features/finance/services/budgets";
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/features/finance/types/budget";

export function useBudgets(userId: string | undefined) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";

  const budgetsQuery = useQuery({
    queryKey: financeKeys.budgets(resolvedUserId),
    queryFn: () => fetchBudgets(resolvedUserId),
    enabled: Boolean(userId),
    networkMode: "offlineFirst",
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: financeKeys.budgets(resolvedUserId) });

  const createMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: (input: CreateBudgetInput) => createBudget(resolvedUserId, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: ({ id, input }: { id: string; input: UpdateBudgetInput }) =>
      updateBudget(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: invalidate,
  });

  return { budgetsQuery, createMutation, updateMutation, deleteMutation };
}
