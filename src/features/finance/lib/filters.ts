// Pure transaction search + filtering. Kept framework-free so it is trivially
// unit-tested and reusable by the list view, calendar, and command palette.

import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
  type TransactionType,
} from "@/features/finance/types/common";
import type { Transaction } from "@/features/finance/types/transaction";

export interface TransactionFilters {
  search: string;
  /** Empty array => all types. */
  types: TransactionType[];
  categoryIds: string[];
  paymentMethods: PaymentMethod[];
  accountIds: string[];
  minAmount: number | null;
  maxAmount: number | null;
  /** Inclusive date-key bounds; null => unbounded. */
  fromDate: string | null;
  toDate: string | null;
}

export function defaultFilters(): TransactionFilters {
  return {
    search: "",
    types: [],
    categoryIds: [],
    paymentMethods: [],
    accountIds: [],
    minAmount: null,
    maxAmount: null,
    fromDate: null,
    toDate: null,
  };
}

/** Whether any filter (other than free-text search) is active. */
export function hasActiveFilters(filters: TransactionFilters): boolean {
  return (
    filters.types.length > 0
    || filters.categoryIds.length > 0
    || filters.paymentMethods.length > 0
    || filters.accountIds.length > 0
    || filters.minAmount !== null
    || filters.maxAmount !== null
    || filters.fromDate !== null
    || filters.toDate !== null
  );
}

/** Number of transactions matching a free-text query, for a single tx. */
function matchesSearch(
  tx: Transaction,
  query: string,
  categoryNameById: Map<string, string>,
): boolean {
  if (!query) return true;
  const haystack: string[] = [
    tx.title,
    tx.notes ?? "",
    tx.tags.join(" "),
    PAYMENT_METHOD_LABELS[tx.paymentMethod],
    tx.categoryId ? categoryNameById.get(tx.categoryId) ?? "" : "",
    String(tx.amount),
  ];
  return haystack.some((value) => value.toLowerCase().includes(query));
}

/**
 * Apply all filters. `categoryNameById` powers name-based text search; pass an
 * empty map if unavailable (search then ignores category names).
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
  categoryNameById: Map<string, string> = new Map(),
): Transaction[] {
  const query = filters.search.trim().toLowerCase();

  return transactions.filter((tx) => {
    if (filters.types.length && !filters.types.includes(tx.type)) return false;
    if (filters.categoryIds.length) {
      if (!tx.categoryId || !filters.categoryIds.includes(tx.categoryId)) return false;
    }
    if (filters.paymentMethods.length && !filters.paymentMethods.includes(tx.paymentMethod)) {
      return false;
    }
    if (filters.accountIds.length) {
      if (!tx.accountId || !filters.accountIds.includes(tx.accountId)) return false;
    }
    if (filters.minAmount !== null && tx.amount < filters.minAmount) return false;
    if (filters.maxAmount !== null && tx.amount > filters.maxAmount) return false;
    if (filters.fromDate !== null && tx.occurredOn < filters.fromDate) return false;
    if (filters.toDate !== null && tx.occurredOn > filters.toDate) return false;
    if (!matchesSearch(tx, query, categoryNameById)) return false;
    return true;
  });
}

/** Sort transactions newest-first (by day, then time, then insertion). */
export function sortByRecency(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) =>
      b.occurredOn.localeCompare(a.occurredOn)
      || (b.occurredAt ?? "").localeCompare(a.occurredAt ?? "")
      || b.createdAt.localeCompare(a.createdAt),
  );
}
