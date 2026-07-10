import { describe, expect, it } from "vitest";

import { makeTx } from "@/features/finance/lib/__fixtures";
import { buildMonthGrid, transactionsOnDay } from "@/features/finance/lib/calendar";

describe("buildMonthGrid", () => {
  const grid = buildMonthGrid(
    "2026-07",
    [
      makeTx({ type: "income", amount: 1000, occurredOn: "2026-07-10" }),
      makeTx({ type: "expense", amount: 250, occurredOn: "2026-07-10" }),
      makeTx({ type: "expense", amount: 40, occurredOn: "2026-07-01" }),
    ],
    "2026-07-10",
  );

  it("always produces a 42-cell grid", () => {
    expect(grid).toHaveLength(42);
  });

  it("starts on the Monday on/before the 1st (2026-07-01 is Wed)", () => {
    expect(grid[0].dateKey).toBe("2026-06-29"); // Monday
    expect(grid[0].inCurrentMonth).toBe(false);
  });

  it("aggregates income/expense/net per day and marks today", () => {
    const tenth = grid.find((cell) => cell.dateKey === "2026-07-10");
    expect(tenth).toMatchObject({
      income: 1000,
      expense: 250,
      net: 750,
      transactionCount: 2,
      isToday: true,
      inCurrentMonth: true,
    });
  });
});

describe("transactionsOnDay", () => {
  it("returns only that day's transactions, latest time first", () => {
    const result = transactionsOnDay(
      [
        makeTx({ id: "a", occurredOn: "2026-07-10", occurredAt: "09:00" }),
        makeTx({ id: "b", occurredOn: "2026-07-10", occurredAt: "18:00" }),
        makeTx({ id: "c", occurredOn: "2026-07-11" }),
      ],
      "2026-07-10",
    );
    expect(result.map((tx) => tx.id)).toEqual(["b", "a"]);
  });
});
