import type { FinanceColor } from "@/features/finance/types/common";

export type AccountType = "cash" | "bank" | "credit_card" | "wallet" | "other";

export const ACCOUNT_TYPES: readonly AccountType[] = [
  "cash",
  "bank",
  "credit_card",
  "wallet",
  "other",
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: "Cash",
  bank: "Bank Account",
  credit_card: "Credit Card",
  wallet: "Digital Wallet",
  other: "Other",
};

export interface FinanceAccount {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  icon: string;
  color: FinanceColor;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

/** An account with its live balance derived from its transactions. */
export interface AccountWithBalance extends FinanceAccount {
  balance: number;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  icon: string;
  color: FinanceColor;
}

export type UpdateAccountInput = Partial<CreateAccountInput> & {
  isArchived?: boolean;
};
