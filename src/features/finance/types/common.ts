// Shared primitives for the Personal Finance module: the colour palette (shared
// with habits so the whole app feels consistent), payment methods, and the
// transaction type union. Payment methods are a fixed catalogue enforced by a
// CHECK constraint in the database and mirrored here.

export type FinanceColor =
  | "slate"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "pink"
  | "rose"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan";

export const FINANCE_COLORS: readonly FinanceColor[] = [
  "slate",
  "blue",
  "indigo",
  "violet",
  "purple",
  "pink",
  "rose",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
];

export type TransactionType = "income" | "expense" | "transfer";

export type PaymentMethod =
  | "cash"
  | "upi"
  | "debit_card"
  | "credit_card"
  | "bank_transfer"
  | "digital_wallet"
  | "other";

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  "cash",
  "upi",
  "debit_card",
  "credit_card",
  "bank_transfer",
  "digital_wallet",
  "other",
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  debit_card: "Debit Card",
  credit_card: "Credit Card",
  bank_transfer: "Bank Transfer",
  digital_wallet: "Digital Wallet",
  other: "Other",
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  cash: "banknote",
  upi: "smartphone",
  debit_card: "credit-card",
  credit_card: "credit-card",
  bank_transfer: "landmark",
  digital_wallet: "wallet",
  other: "circle-dollar-sign",
};

/** The app's default reporting currency. Individual accounts may differ. */
export const DEFAULT_CURRENCY = "INR";
