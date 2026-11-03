import { useMemo } from "react";

import { useCategories } from "@/features/finance/hooks/useCategories";
import { useFinanceAccounts } from "@/features/finance/hooks/useFinanceAccounts";
import { useTransactions } from "@/features/finance/hooks/useTransactions";
import { monthKeyOf } from "@/features/finance/lib/dates";
import { signedAmount } from "@/features/finance/types/transaction";
import type { AccountWithBalance } from "@/features/finance/types/account";
import type { TransactionCategory } from "@/features/finance/types/category";
import type { Transaction } from "@/features/finance/types/transaction";

/**
 * Composes the shared finance read queries (categories, accounts, transactions)
 * and derives the lookup maps + account balances every page needs. Because the
 * three queries are cached by key, mounting this on several pages reuses one
 * network round-trip and keeps them in sync.
 */
export function useFinanceData(userId: string | undefined, timezone: string) {
  const { categoriesQuery } = useCategories(userId);
  const { accountsQuery } = useFinanceAccounts(userId);
  const { todayKey, transactionsQuery } = useTransactions(userId, timezone);

  const categories = useMemo<TransactionCategory[]>(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const transactions = useMemo<Transaction[]>(
    () => transactionsQuery.data ?? [],
    [transactionsQuery.data],
  );

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const accounts = useMemo<AccountWithBalance[]>(() => {
    const raw = accountsQuery.data ?? [];
    const netByAccount = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.accountId) {
        netByAccount.set(tx.accountId, (netByAccount.get(tx.accountId) ?? 0) + signedAmount(tx));
      }
      // A transfer credits its destination account.
      if (tx.type === "transfer" && tx.transferAccountId) {
        netByAccount.set(
          tx.transferAccountId,
          (netByAccount.get(tx.transferAccountId) ?? 0) + tx.amount,
        );
        if (tx.accountId) {
          netByAccount.set(tx.accountId, (netByAccount.get(tx.accountId) ?? 0) - tx.amount);
        }
      }
    }
    return raw.map((account) => ({
      ...account,
      balance: account.initialBalance + (netByAccount.get(account.id) ?? 0),
    }));
  }, [accountsQuery.data, transactions]);

  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );

  return {
    todayKey,
    monthKey: monthKeyOf(todayKey),
    categories,
    transactions,
    accounts,
    categoriesById,
    categoryNameById,
    accountsById,
    isLoading:
      categoriesQuery.isLoading || accountsQuery.isLoading || transactionsQuery.isLoading,
    isError: categoriesQuery.isError || accountsQuery.isError || transactionsQuery.isError,
    refetch: () => {
      void categoriesQuery.refetch();
      void accountsQuery.refetch();
      void transactionsQuery.refetch();
    },
  };
}
