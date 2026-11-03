// Shared input sanitizers. These keep numeric fields valid *as the user types*
// (and when pasting), so the UI prevents bad input rather than only rejecting it
// on submit. Every helper returns a string that is safe to store in component
// state and to pass to `Number(...)` for validation.
//
// Guarantees for numeric helpers:
//   • Reject alphabetic characters, emojis, and stray symbols.
//   • Reject scientific notation ("1e5" → "15").
//   • Collapse multiple decimal points to a single one.
//   • Strip leading/inner whitespace.
//   • Reject a leading minus unless `allowNegative` is set.

export interface SanitizeNumberOptions {
  /** Permit a single leading minus sign (e.g. account balances that can be negative). */
  allowNegative?: boolean;
}

/**
 * Keep only the characters valid for a decimal number. Preserves a single
 * decimal point and, when allowed, a single leading minus sign.
 */
export function sanitizeDecimalString(
  raw: string,
  { allowNegative = false }: SanitizeNumberOptions = {},
): string {
  const negative = allowNegative && /^\s*-/.test(raw);
  // Drop everything except digits and dots (removes spaces, letters, "e", symbols).
  let digits = raw.replace(/[^\d.]/g, "");

  const firstDot = digits.indexOf(".");
  if (firstDot !== -1) {
    // Keep the first dot, remove any subsequent ones.
    digits =
      digits.slice(0, firstDot + 1) + digits.slice(firstDot + 1).replace(/\./g, "");
  }

  return negative ? `-${digits}` : digits;
}

/**
 * Keep only the characters valid for a whole number. When allowed, a single
 * leading minus sign is preserved.
 */
export function sanitizeIntegerString(
  raw: string,
  { allowNegative = false }: SanitizeNumberOptions = {},
): string {
  const negative = allowNegative && /^\s*-/.test(raw);
  const digits = raw.replace(/\D/g, "");
  return negative && digits ? `-${digits}` : digits;
}

/**
 * Normalize a pasted amount into a plain number string, e.g. " ₹5,000 " → "5000"
 * and " 75 " → "75". Direction (negative) is preserved only when allowed.
 */
export function normalizeAmountString(
  raw: string,
  options: SanitizeNumberOptions = {},
): string {
  return sanitizeDecimalString(raw, options);
}
