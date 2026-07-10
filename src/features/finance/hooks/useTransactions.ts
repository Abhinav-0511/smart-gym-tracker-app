import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getLocalDateString } from "@/types/dashboard";
import { financeKeys } from "@/features/finance/hooks/keys";
import { addMonths, monthKeyOf, startOfMonthKey } from "@/features/finance/lib/dates";
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  TRANSACTION_HISTORY_MONTHS,
  updateTransaction,
} from "@/features/finance/services/transactions";
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from "@/features/finance/types/transaction";

/** Compute the inclusive lower bound for the loaded transaction window. */
export function transactionWindowStart(todayKey: string): string {
  const monthKey = monthKeyOf(todayKey);
  return startOfMonthKey(addMonths(monthKey, -(TRANSACTION_HISTORY_MONTHS - 1)));
}

export function useTransactions(userId: string | undefined, timezone: string) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";
  const todayKey = getLocalDateString(new Date(), timezone);
  const fromDate = transactionWindowStart(todayKey);
  const listKey = financeKeys.transactions(resolvedUserId, fromDate);

  const transactionsQuery = useQuery({
    queryKey: listKey,
    queryFn: () => fetchTransactions(resolvedUserId, { fromDate }),
    enabled: Boolean(userId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: financeKeys.all });

  const createMutation = useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      createTransaction(resolvedUserId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Transaction[]>(listKey);
      const now = new Date().toISOString();
      const optimistic: Transaction = {
        id: `optimistic-${now}`,
        userId: resolvedUserId,
        accountId: input.accountId,
        categoryId: input.type === "transfer" ? null : input.categoryId,
        type: input.type,
        amount: input.amount,
        title: input.title,
        notes: input.notes ?? null,
        paymentMethod: input.paymentMethod,
        occurredOn: input.occurredOn,
        occurredAt: input.occurredAt ?? null,
        tags: input.tags ?? [],
        receiptUrl: input.receiptUrl ?? null,
        transferAccountId: input.transferAccountId ?? null,
        recurringTransactionId: input.recurringTransactionId ?? null,
        createdAt: now,
        updatedAt: now,
      };
      queryClient.setQueryData<Transaction[]>(listKey, (current) =>
        [optimistic, ...(current ?? [])],
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },
    onSettled: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
      updateTransaction(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Transaction[]>(listKey);
      queryClient.setQueryData<Transaction[]>(listKey, (current) =>
        (current ?? []).filter((tx) => tx.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },
    onSettled: invalidate,
  });

  return {
    todayKey,
    fromDate,
    transactionsQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
