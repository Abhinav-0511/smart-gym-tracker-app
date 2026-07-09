import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
} from "@/services/notifications";

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

describe("notification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads a page and maps persisted read state", async () => {
    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.range.mockResolvedValue({
      data: [
        {
          action_url: "/prs",
          created_at: "2026-07-06T10:00:00.000Z",
          icon: "trophy",
          id: "notification-1",
          message: "Bench Press: 100 kg.",
          metadata: { record_id: "record-1" },
          priority: "high",
          read_at: null,
          title: "New personal record",
          type: "personal_record",
          user_id: "user-1",
        },
      ],
      error: null,
    });
    supabaseMock.from.mockReturnValue(chain);

    const page = await fetchNotifications("user-1", 0, 20);

    expect(page.items[0]).toMatchObject({
      id: "notification-1",
      read: false,
      actionUrl: "/prs",
    });
    expect(page.nextOffset).toBeNull();
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(chain.range).toHaveBeenCalledWith(0, 19);
  });

  it("loads the exact unread badge count", async () => {
    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
      is: vi.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.is.mockResolvedValue({ count: 4, error: null });
    supabaseMock.from.mockReturnValue(chain);

    await expect(fetchUnreadNotificationCount("user-1")).resolves.toBe(4);
    expect(chain.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
  });

  it("scopes read and delete actions to the authenticated owner", async () => {
    const updateChain = {
      update: vi.fn(),
      eq: vi.fn(),
      is: vi.fn(),
    };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.is.mockResolvedValue({ error: null });
    supabaseMock.from.mockReturnValueOnce(updateChain);

    await markNotificationRead("user-1", "notification-1");
    expect(updateChain.eq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(updateChain.eq).toHaveBeenNthCalledWith(2, "id", "notification-1");

    const deleteChain = {
      delete: vi.fn(),
      eq: vi.fn(),
    };
    deleteChain.delete.mockReturnValue(deleteChain);
    deleteChain.eq
      .mockReturnValueOnce(deleteChain)
      .mockResolvedValueOnce({ error: null });
    supabaseMock.from.mockReturnValueOnce(deleteChain);

    await deleteNotification("user-1", "notification-1");
    expect(deleteChain.eq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(deleteChain.eq).toHaveBeenNthCalledWith(2, "id", "notification-1");
  });
});
