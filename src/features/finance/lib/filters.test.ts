import { describe, expect, it } from "vitest";

import { makeTx } from "@/features/finance/lib/__fixtures";
import {
  defaultFilters,
  filterTransactions,
  hasActiveFilters,
  sortByRecency,
} from "@/features/finance/lib/filters";

const sample = [
  makeTx({ id: "a", type: "income", amount: 1000, title: "Salary", categoryId: "salary", occurredOn: "2026-07-01", paymentMethod: "bank_transfer" }),
  makeTx({ id: "b", type: "expense", amount: 250, title: "Dinner", categoryId: "food", occurredOn: "2026-07-10", paymentMethod: "upi", tags: ["weekend"] }),
  makeTx({ id: "c", type: "expense", amount: 50, title: "Bus fare", categoryId: "transport", occurredOn: "2026-07-12", paymentMethod: "cash" }),
];

describe("filterTransactions", () => {
  it("filters by type", () => {
    const result = filterTransactions(sample, { ...defaultFilters(), types: ["expense"] });
    expect(result.map((tx) => tx.id)).toEqual(["b", "c"]);
  });

  it("filters by amount range and date range", () => {
    const byAmount = filterTransactions(sample, { ...defaultFilters(), minAmount: 100 });
    expect(byAmount.map((tx) => tx.id)).toEqual(["a", "b"]);

    const byDate = filterTransactions(sample, {
      ...defaultFilters(),
      fromDate: "2026-07-05",
      toDate: "2026-07-11",
    });
    expect(byDate.map((tx) => tx.id)).toEqual(["b"]);
  });

  it("searches title, tags, payment method label, and category name", () => {
    const names = new Map([["food", "Food & Dining"]]);
    expect(filterTransactions(sample, { ...defaultFilters(), search: "dinner" }).map((t) => t.id)).toEqual(["b"]);
    expect(filterTransactions(sample, { ...defaultFilters(), search: "weekend" }).map((t) => t.id)).toEqual(["b"]);
    expect(filterTransactions(sample, { ...defaultFilters(), search: "upi" }).map((t) => t.id)).toEqual(["b"]);
    expect(filterTransactions(sample, { ...defaultFilters(), search: "dining" }, names).map((t) => t.id)).toEqual(["b"]);
  });

  it("filters by payment method and category", () => {
    expect(filterTransactions(sample, { ...defaultFilters(), paymentMethods: ["cash"] }).map((t) => t.id)).toEqual(["c"]);
    expect(filterTransactions(sample, { ...defaultFilters(), categoryIds: ["salary"] }).map((t) => t.id)).toEqual(["a"]);
  });
});

describe("hasActiveFilters", () => {
  it("ignores the free-text search", () => {
    expect(hasActiveFilters({ ...defaultFilters(), search: "x" })).toBe(false);
    expect(hasActiveFilters({ ...defaultFilters(), types: ["income"] })).toBe(true);
  });
});

describe("sortByRecency", () => {
  it("orders newest day first", () => {
    expect(sortByRecency(sample).map((tx) => tx.id)).toEqual(["c", "b", "a"]);
  });
});
