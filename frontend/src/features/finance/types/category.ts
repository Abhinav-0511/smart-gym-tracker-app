import type { FinanceColor } from "@/features/finance/types/common";

export type CategoryKind = "income" | "expense";

export interface TransactionCategory {
  id: string;
  userId: string;
  name: string;
  slug: string;
  kind: CategoryKind;
  icon: string;
  color: FinanceColor;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  kind: CategoryKind;
  icon: string;
  color: FinanceColor;
  sortOrder?: number;
}

export type UpdateCategoryInput = Partial<
  Pick<TransactionCategory, "name" | "icon" | "color" | "sortOrder">
>;

/** Shape of a seedable default category (see default-categories.ts). */
export interface DefaultCategorySeed {
  slug: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: FinanceColor;
}
