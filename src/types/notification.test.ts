import { describe, expect, it } from "vitest";

import {
  getNotificationGroup,
  notificationActionPage,
} from "@/types/notification";

describe("notification presentation", () => {
  const now = new Date("2026-07-06T12:00:00.000Z");

  it("groups notification history by age", () => {
    expect(getNotificationGroup("2026-07-06T08:00:00.000Z", now)).toBe("Today");
    expect(getNotificationGroup("2026-07-05T08:00:00.000Z", now)).toBe(
      "Yesterday",
    );
    expect(getNotificationGroup("2026-07-02T08:00:00.000Z", now)).toBe(
      "This Week",
    );
    expect(getNotificationGroup("2026-06-20T08:00:00.000Z", now)).toBe(
      "Earlier",
    );
  });

  it("maps safe action URLs to the existing app navigation", () => {
    expect(notificationActionPage("/workout")).toBe("workout");
    expect(notificationActionPage("/prs")).toBe("prs");
    expect(notificationActionPage("https://example.com")).toBeNull();
    expect(notificationActionPage(null)).toBeNull();
  });
});
