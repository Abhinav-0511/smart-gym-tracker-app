import type {
  PaymentMethod,
  TransactionType,
} from "@/features/finance/types/common";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string | null;
  categoryId: string | null;
  type: TransactionType;
  amount: number;
  title: string;
  notes: string | null;
  paymentMethod: PaymentMethod;
  /** `YYYY-MM-DD` calendar day the money moved. */
  occurredOn: string;
  /** `HH:MM` local time, optional. */
  occurredAt: string | null;
  tags: string[];
  receiptUrl: string | null;
  transferAccountId: string | null;
  recurringTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  title: string;
  categoryId: string | null;
  accountId: string | null;
  paymentMethod: PaymentMethod;
  occurredOn: string;
  occurredAt?: string | null;
  notes?: string | null;
  tags?: string[];
  receiptUrl?: string | null;
  transferAccountId?: string | null;
  recurringTransactionId?: string | null;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

/** Signed contribution of a transaction to net balance (income +, expense -). */
export function signedAmount(transaction: Pick<Transaction, "type" | "amount">): number {
  if (transaction.type === "income") return transaction.amount;
  if (transaction.type === "expense") return -transaction.amount;
  return 0; // transfers are net-zero across the user's own accounts
}
