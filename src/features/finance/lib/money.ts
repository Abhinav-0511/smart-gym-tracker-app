// Money formatting and parsing helpers. Amounts are stored as positive numbers;
// direction is expressed by the transaction type, not the sign.

import { DEFAULT_CURRENCY } from "@/features/finance/types/common";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  AED: "د.إ",
};

/** Symbol for a currency code, falling back to the code itself. */
export function currencySymbol(currency: string = DEFAULT_CURRENCY): string {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `;
}

/**
 * Format an amount as currency, e.g. 1234.5 -> "₹1,234.50". Whole numbers drop
 * the decimals to stay clean ("₹1,234").
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const negative = safe < 0;
  const abs = Math.abs(safe);
  const hasFraction = Math.round(abs * 100) % 100 !== 0;
  const formatted = abs.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${negative ? "-" : ""}${currencySymbol(currency)}${formatted}`;
}

/**
 * A signed, plus-prefixed amount for ledgers, e.g. income -> "+₹500",
 * expense -> "-₹500". Transfers render without a sign.
 */
export function formatSignedCurrency(
  amount: number,
  direction: "in" | "out" | "neutral",
  currency: string = DEFAULT_CURRENCY,
): string {
  const base = formatCurrency(Math.abs(amount), currency);
  if (direction === "in") return `+${base}`;
  if (direction === "out") return `-${base}`;
  return base;
}

/** Compact currency for charts/axes, e.g. 1250000 -> "₹1.3M", 12000 -> "₹12K". */
export function formatCompactCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? "-" : "";
  const symbol = currencySymbol(currency);
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}K`;
  return `${sign}${symbol}${abs}`;
}

/**
 * Parse a user-entered amount string into a positive number, or null when it is
 * not a valid, strictly-positive value. Strips currency symbols, commas, spaces.
 */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  // Round to 2 decimal places to match the numeric(14,2) column.
  return Math.round(value * 100) / 100;
}

/** Clamp a percentage to a whole number in the 0–100 range. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
