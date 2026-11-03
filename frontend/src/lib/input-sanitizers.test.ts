import { describe, expect, it } from "vitest";

import {
  sanitizeDecimalString,
  sanitizeIntegerString,
} from "@/lib/input-sanitizers";

describe("sanitizeDecimalString", () => {
  it("keeps valid decimals untouched", () => {
    expect(sanitizeDecimalString("75.5")).toBe("75.5");
    expect(sanitizeDecimalString("0.25")).toBe("0.25");
  });

  it("rejects alphabetic characters and emojis", () => {
    expect(sanitizeDecimalString("75kg")).toBe("75");
    expect(sanitizeDecimalString("abc")).toBe("");
    expect(sanitizeDecimalString("12🔥3")).toBe("123");
  });

  it("prevents scientific notation", () => {
    expect(sanitizeDecimalString("1e5")).toBe("15");
    expect(sanitizeDecimalString("2E10")).toBe("210");
  });

  it("collapses multiple decimal points", () => {
    expect(sanitizeDecimalString("10.5.5")).toBe("10.55");
    expect(sanitizeDecimalString("1..2")).toBe("1.2");
  });

  it("strips whitespace and currency formatting", () => {
    expect(sanitizeDecimalString(" 75 ")).toBe("75");
    expect(sanitizeDecimalString("₹5,000")).toBe("5000");
    expect(sanitizeDecimalString("$1,234.50")).toBe("1234.50");
  });

  it("rejects negatives unless explicitly allowed", () => {
    expect(sanitizeDecimalString("-50")).toBe("50");
    expect(sanitizeDecimalString("-50", { allowNegative: true })).toBe("-50");
    expect(sanitizeDecimalString("-1-2", { allowNegative: true })).toBe("-12");
  });
});

describe("sanitizeIntegerString", () => {
  it("keeps only digits", () => {
    expect(sanitizeIntegerString("12")).toBe("12");
    expect(sanitizeIntegerString("12.5")).toBe("125");
    expect(sanitizeIntegerString("8 reps")).toBe("8");
  });

  it("rejects negatives unless allowed", () => {
    expect(sanitizeIntegerString("-3")).toBe("3");
    expect(sanitizeIntegerString("-3", { allowNegative: true })).toBe("-3");
  });

  it("returns empty string for non-numeric input", () => {
    expect(sanitizeIntegerString("abc")).toBe("");
    expect(sanitizeIntegerString("-", { allowNegative: true })).toBe("");
  });
});
