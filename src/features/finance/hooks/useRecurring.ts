import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financeKeys } from "@/features/finance/hooks/keys";
import {
  createRecurring,
  deleteRecurring,
  fetchRecurringTransactions,
  postRecurringOccurrence,
  updateRecurring,
} from "@/features/finance/services/recurring";
import type {
  CreateRecurringInput,
  RecurringTransaction,
  UpdateRecurringInput,
} from "@/features/finance/types/recurring";

export function useRecurring(userId: string | undefined) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";

  const recurringQuery = useQuery({
    queryKey: financeKeys.recurring(resolvedUserId),
    queryFn: () => fetchRecurringTransactions(resolvedUserId),
    enabled: Boolean(userId),
    networkMode: "offlineFirst",
  });

  // Posting an occurrence creates a transaction, so invalidate all finance data.
  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: financeKeys.all });
  const invalidateRecurring = () =>
    queryClient.invalidateQueries({ queryKey: financeKeys.recurring(resolvedUserId) });

  const createMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: (input: CreateRecurringInput) => createRecurring(resolvedUserId, input),
    onSuccess: invalidateRecurring,
  });

  const updateMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: ({ id, input }: { id: string; input: UpdateRecurringInput }) =>
      updateRecurring(id, input),
    onSuccess: invalidateRecurring,
  });

  const deleteMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: (id: string) => deleteRecurring(id),
    onSuccess: invalidateRecurring,
  });

  const postMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: (recurring: RecurringTransaction) =>
      postRecurringOccurrence(resolvedUserId, recurring),
    onSuccess: invalidateAll,
  });

  return { recurringQuery, createMutation, updateMutation, deleteMutation, postMutation };
}
