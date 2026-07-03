import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProgress } from "@/hooks/useProgress";

const serviceMocks = vi.hoisted(() => ({
  fetchProgressData: vi.fn(),
}));

vi.mock("@/services/progress", () => serviceMocks);

const emptyProgress = {
  bodyWeight: [],
  exerciseProgressions: [],
  weeklyFrequency: [],
  monthlyFrequency: [],
  weeklyVolume: [],
  weeklyDuration: [],
  averageWorkoutDurationMinutes: null,
  consistencyPercent: 0,
  bodyWeightChangeKg: null,
  volumeTrendPercent: null,
  workoutTrendPercent: null,
};

function createWrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("useProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.fetchProgressData.mockResolvedValue(emptyProgress);
  });

  it("loads progress and refetches when remounted after a completed workout", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const first = renderHook(() => useProgress("user-1", "UTC"), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    serviceMocks.fetchProgressData.mockResolvedValue({
      ...emptyProgress,
      weeklyFrequency: [{ period: "2026-07-06", label: "Jul 6", value: 1 }],
    });
    const second = renderHook(() => useProgress("user-1", "UTC"), {
      wrapper: createWrapper(client),
    });

    await waitFor(() =>
      expect(second.result.current.data?.weeklyFrequency[0]?.value).toBe(1),
    );
    expect(serviceMocks.fetchProgressData).toHaveBeenCalledTimes(2);
  });
});
