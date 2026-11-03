// Test-only factories for building Transaction fixtures compactly. Imported by
// the *.test.ts files in this folder; tree-shaken out of the production build.

import type { Transaction } from "@/features/finance/types/transaction";

export function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    userId: "u1",
    accountId: null,
    categoryId: null,
    type: "expense",
    amount: 100,
    title: "Item",
    notes: null,
    paymentMethod: "cash",
    occurredOn: "2026-07-10",
    occurredAt: null,
    tags: [],
    receiptUrl: null,
    transferAccountId: null,
    recurringTransactionId: null,
    createdAt: "2026-07-10T00:00:00.000Z",
    updatedAt: "2026-07-10T00:00:00.000Z",
    ...overrides,
  };
}
