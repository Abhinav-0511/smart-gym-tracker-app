import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useNotifications } from "@/hooks/useNotifications";

const serviceMocks = vi.hoisted(() => ({
  fetchNotifications: vi.fn(),
  fetchUnreadNotificationCount: vi.fn(),
}));

const realtimeMocks = vi.hoisted(() => {
  const channel = {
    on: vi.fn(),
    subscribe: vi.fn(),
  };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  return {
    channel,
    channelFactory: vi.fn(() => channel),
    removeChannel: vi.fn(),
  };
});

vi.mock("@/services/notifications", async () => {
  const actual = await vi.importActual("@/services/notifications");
  return {
    ...actual,
    fetchNotifications: serviceMocks.fetchNotifications,
    fetchUnreadNotificationCount: serviceMocks.fetchUnreadNotificationCount,
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    channel: realtimeMocks.channelFactory,
    removeChannel: realtimeMocks.removeChannel,
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useNotifications realtime", () => {
  it("subscribes to only the current user's rows and cleans up", async () => {
    serviceMocks.fetchNotifications.mockResolvedValue({
      items: [],
      nextOffset: null,
    });
    serviceMocks.fetchUnreadNotificationCount.mockResolvedValue(0);

    const { result, unmount } = renderHook(() => useNotifications("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current.notificationsQuery.isSuccess).toBe(true),
    );
    expect(realtimeMocks.channelFactory).toHaveBeenCalledWith(
      "notifications:user-1",
    );
    expect(realtimeMocks.channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        table: "notifications",
        filter: "user_id=eq.user-1",
      }),
      expect.any(Function),
    );
    expect(realtimeMocks.channel.subscribe).toHaveBeenCalled();

    unmount();
    expect(realtimeMocks.removeChannel).toHaveBeenCalledWith(
      realtimeMocks.channel,
    );
  });
});
