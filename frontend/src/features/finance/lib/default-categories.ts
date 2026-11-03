// Seedable default categories. On first load the client idempotently upserts
// these per-user (see categories service), so every transaction references a
// real, owned category row. Users can add, rename, recolour, or hide their own.

import type { DefaultCategorySeed } from "@/features/finance/types/category";

export const DEFAULT_INCOME_CATEGORIES: readonly DefaultCategorySeed[] = [
  { slug: "salary", name: "Salary", kind: "income", icon: "briefcase", color: "emerald" },
  { slug: "business", name: "Business", kind: "income", icon: "building", color: "teal" },
  { slug: "freelance", name: "Freelance", kind: "income", icon: "laptop", color: "cyan" },
  { slug: "investment", name: "Investment", kind: "income", icon: "trending-up", color: "green" },
  { slug: "interest", name: "Interest", kind: "income", icon: "percent", color: "lime" },
  { slug: "bonus", name: "Bonus", kind: "income", icon: "award", color: "amber" },
  { slug: "gift", name: "Gift", kind: "income", icon: "gift", color: "pink" },
  { slug: "refund", name: "Refund", kind: "income", icon: "rotate-ccw", color: "blue" },
  { slug: "rental-income", name: "Rental Income", kind: "income", icon: "home", color: "indigo" },
  { slug: "other-income", name: "Other", kind: "income", icon: "circle-dollar-sign", color: "slate" },
];

export const DEFAULT_EXPENSE_CATEGORIES: readonly DefaultCategorySeed[] = [
  { slug: "food-dining", name: "Food & Dining", kind: "expense", icon: "utensils", color: "orange" },
  { slug: "groceries", name: "Groceries", kind: "expense", icon: "shopping-cart", color: "lime" },
  { slug: "rent-housing", name: "Rent & Housing", kind: "expense", icon: "home", color: "indigo" },
  { slug: "utilities", name: "Utilities", kind: "expense", icon: "zap", color: "amber" },
  { slug: "transport", name: "Transport", kind: "expense", icon: "bus", color: "blue" },
  { slug: "medical", name: "Medical", kind: "expense", icon: "stethoscope", color: "red" },
  { slug: "education", name: "Education", kind: "expense", icon: "graduation-cap", color: "violet" },
  { slug: "entertainment", name: "Entertainment", kind: "expense", icon: "clapperboard", color: "purple" },
  { slug: "shopping", name: "Shopping", kind: "expense", icon: "shopping-bag", color: "pink" },
  { slug: "subscriptions", name: "Subscriptions", kind: "expense", icon: "tv", color: "rose" },
  { slug: "travel", name: "Travel", kind: "expense", icon: "plane", color: "cyan" },
  { slug: "mobile-recharge", name: "Mobile & Recharge", kind: "expense", icon: "smartphone", color: "teal" },
  { slug: "gifts-donations", name: "Gifts & Donations", kind: "expense", icon: "gift", color: "rose" },
  { slug: "family", name: "Family", kind: "expense", icon: "users", color: "emerald" },
  { slug: "pets", name: "Pets", kind: "expense", icon: "paw-print", color: "yellow" },
  { slug: "insurance", name: "Insurance", kind: "expense", icon: "shield", color: "slate" },
  { slug: "taxes", name: "Taxes", kind: "expense", icon: "landmark", color: "slate" },
  { slug: "personal-care", name: "Personal Care", kind: "expense", icon: "scissors", color: "pink" },
  { slug: "fitness", name: "Fitness", kind: "expense", icon: "dumbbell", color: "green" },
  { slug: "other-expense", name: "Other", kind: "expense", icon: "circle-dollar-sign", color: "slate" },
];

export const DEFAULT_CATEGORIES: readonly DefaultCategorySeed[] = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];

/** Derive a safe, unique-ish slug from a user-entered category name. */
export function slugifyCategory(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `category-${Date.now().toString(36)}`;
}
