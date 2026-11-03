// Shared React Query keys for the Finance module. Centralised so pages share
// one cache: a transaction added on the Transactions page instantly updates the
// Dashboard, Budgets, and Reports.

export const financeKeys = {
  all: ["finance"] as const,
  categories: (userId: string) => ["finance", "categories", userId] as const,
  accounts: (userId: string) => ["finance", "accounts", userId] as const,
  transactions: (userId: string, fromDate: string) =>
    ["finance", "transactions", userId, fromDate] as const,
  budgets: (userId: string) => ["finance", "budgets", userId] as const,
  savings: (userId: string) => ["finance", "savings", userId] as const,
  recurring: (userId: string) => ["finance", "recurring", userId] as const,
};
