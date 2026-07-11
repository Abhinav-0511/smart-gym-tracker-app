import { describe, expect, it } from "vitest";

import {
  addDays,
  addMonths,
  daysInMonth,
  endOfMonthKey,
  monthKeyOf,
  periodRange,
  startOfMonthKey,
  weekdayOfKey,
} from "@/features/finance/lib/dates";

describe("date-key helpers", () => {
  it("adds days across month boundaries in UTC", () => {
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("derives month keys and bounds", () => {
    expect(monthKeyOf("2026-07-10")).toBe("2026-07");
    expect(startOfMonthKey("2026-07")).toBe("2026-07-01");
    expect(endOfMonthKey("2026-02")).toBe("2026-02-28");
    expect(endOfMonthKey("2024-02")).toBe("2024-02-29");
    expect(daysInMonth("2026-04")).toBe(30);
  });

  it("adds months and wraps years", () => {
    expect(addMonths("2026-07", 1)).toBe("2026-08");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-11", 3)).toBe("2027-02");
  });

  it("computes weekday (0=Sun)", () => {
    // 2026-07-10 is a Friday.
    expect(weekdayOfKey("2026-07-10")).toBe(5);
  });
});

describe("periodRange", () => {
  it("returns the calendar month for monthly", () => {
    expect(periodRange("monthly", "2026-07-10")).toEqual({
      start: "2026-07-01",
      end: "2026-07-31",
    });
  });

  it("returns the calendar year for yearly", () => {
    expect(periodRange("yearly", "2026-07-10")).toEqual({
      start: "2026-01-01",
      end: "2026-12-31",
    });
  });

  it("returns a Monday–Sunday week for weekly", () => {
    // Friday 2026-07-10 -> week is Mon 2026-07-06 … Sun 2026-07-12.
    expect(periodRange("weekly", "2026-07-10")).toEqual({
      start: "2026-07-06",
      end: "2026-07-12",
    });
  });
});
