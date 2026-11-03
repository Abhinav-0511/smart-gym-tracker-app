import { describe, expect, it } from "vitest";

import {
  clampPercent,
  formatCompactCurrency,
  formatCurrency,
  formatSignedCurrency,
  parseAmount,
} from "@/features/finance/lib/money";

describe("formatCurrency", () => {
  it("drops decimals for whole amounts and keeps them otherwise", () => {
    expect(formatCurrency(1234, "INR")).toBe("₹1,234");
    expect(formatCurrency(1234.5, "INR")).toBe("₹1,234.50");
  });

  it("prefixes a minus for negatives and supports other currencies", () => {
    expect(formatCurrency(-50, "USD")).toBe("-$50");
    expect(formatCurrency(0, "INR")).toBe("₹0");
  });
});

describe("formatSignedCurrency", () => {
  it("prefixes direction sign", () => {
    expect(formatSignedCurrency(500, "in", "INR")).toBe("+₹500");
    expect(formatSignedCurrency(500, "out", "INR")).toBe("-₹500");
    expect(formatSignedCurrency(500, "neutral", "INR")).toBe("₹500");
  });
});

describe("formatCompactCurrency", () => {
  it("abbreviates thousands and millions", () => {
    expect(formatCompactCurrency(12000, "INR")).toBe("₹12.0K");
    expect(formatCompactCurrency(1_250_000, "INR")).toBe("₹1.3M");
    expect(formatCompactCurrency(500, "INR")).toBe("₹500");
  });
});

describe("parseAmount", () => {
  it("parses valid positive amounts and strips symbols", () => {
    expect(parseAmount("₹1,234.50")).toBe(1234.5);
    expect(parseAmount("  99 ")).toBe(99);
  });

  it("rounds to two decimals", () => {
    expect(parseAmount("10.005")).toBe(10.01);
  });

  it("rejects empty, zero, and negative", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
});

describe("clampPercent", () => {
  it("rounds and clamps to 0–100", () => {
    expect(clampPercent(45.6)).toBe(46);
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(Number.NaN)).toBe(0);
  });
});
