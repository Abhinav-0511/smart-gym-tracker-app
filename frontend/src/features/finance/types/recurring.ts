import type { PaymentMethod } from "@/features/finance/types/common";

export type RecurringType = "income" | "expense";

export type RecurringFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export const RECURRING_FREQUENCIES: readonly RecurringFrequency[] = [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
];

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export interface RecurringTransaction {
  id: string;
  userId: string;
  accountId: string | null;
  categoryId: string | null;
  type: RecurringType;
  amount: number;
  title: string;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  nextRunOn: string;
  startOn: string;
  endOn: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringInput {
  type: RecurringType;
  amount: number;
  title: string;
  categoryId: string | null;
  accountId: string | null;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  nextRunOn: string;
  startOn?: string;
  endOn?: string | null;
  notes?: string | null;
}

export type UpdateRecurringInput = Partial<CreateRecurringInput> & {
  isActive?: boolean;
};
