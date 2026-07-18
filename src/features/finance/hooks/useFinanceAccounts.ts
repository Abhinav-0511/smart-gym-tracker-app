import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financeKeys } from "@/features/finance/hooks/keys";
import {
  createAccount,
  deleteAccount,
  fetchAccounts,
  updateAccount,
} from "@/features/finance/services/accounts";
import type {
  CreateAccountInput,
  UpdateAccountInput,
} from "@/features/finance/types/account";

export function useFinanceAccounts(userId: string | undefined) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";

  const accountsQuery = useQuery({
    queryKey: financeKeys.accounts(resolvedUserId),
    queryFn: () => fetchAccounts(resolvedUserId),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    networkMode: "offlineFirst",
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: financeKeys.accounts(resolvedUserId) });

  const createMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: (input: CreateAccountInput) => createAccount(resolvedUserId, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: ({ id, input }: { id: string; input: UpdateAccountInput }) =>
      updateAccount(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    networkMode: "offlineFirst",
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  });

  return { accountsQuery, createMutation, updateMutation, deleteMutation };
}
