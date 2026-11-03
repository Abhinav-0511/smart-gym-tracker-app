import { describe, expect, it } from "vitest";

import { getDailyQuote } from "@/features/productivity/lib/quotes";

describe("getDailyQuote", () => {
  it("is stable for a given date key", () => {
    expect(getDailyQuote("2026-07-10")).toEqual(getDailyQuote("2026-07-10"));
  });

  it("always returns a populated quote", () => {
    const quote = getDailyQuote("2026-01-01");
    expect(quote.text.length).toBeGreaterThan(0);
    expect(quote.author.length).toBeGreaterThan(0);
  });
});
