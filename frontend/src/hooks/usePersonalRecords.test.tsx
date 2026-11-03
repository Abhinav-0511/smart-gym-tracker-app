import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePersonalRecords } from "@/hooks/usePersonalRecords";

const serviceMocks = vi.hoisted(() => ({
  createManualPersonalRecord: vi.fn(),
  deleteManualPersonalRecord: vi.fn(),
  detectPersonalRecords: vi.fn(),
  fetchCompletedSetHistory: vi.fn(),
  fetchExerciseHistory: vi.fn(),
  fetchPersonalRecords: vi.fn(),
  updateManualPersonalRecord: vi.fn(),
}));

vi.mock("@/services/personal-records", () => serviceMocks);

const recordsData = {
  records: [],
  lifetimeBests: [],
  catalog: [],
};

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("usePersonalRecords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.fetchPersonalRecords.mockResolvedValue(recordsData);
    serviceMocks.fetchExerciseHistory.mockResolvedValue([]);
    serviceMocks.fetchCompletedSetHistory.mockResolvedValue([]);
    serviceMocks.detectPersonalRecords.mockResolvedValue(0);
    serviceMocks.createManualPersonalRecord.mockResolvedValue(undefined);
    serviceMocks.updateManualPersonalRecord.mockResolvedValue(undefined);
    serviceMocks.deleteManualPersonalRecord.mockResolvedValue(undefined);
  });

  it("loads records and exercise history", async () => {
    const { result } = renderHook(
      () => usePersonalRecords("user-1", "exercise-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.recordsQuery.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.historyQuery.isSuccess).toBe(true));
    await waitFor(() =>
      expect(result.current.completedSetsQuery.isSuccess).toBe(true),
    );

    expect(serviceMocks.fetchPersonalRecords).toHaveBeenCalledWith("user-1");
    expect(serviceMocks.fetchCompletedSetHistory).toHaveBeenCalledWith("user-1");
    expect(serviceMocks.fetchExerciseHistory).toHaveBeenCalledWith(
      "user-1",
      "exercise-1",
    );
  });

  it("creates, edits, and deletes manual records", async () => {
    const { result } = renderHook(
      () => usePersonalRecords("user-1", undefined),
      { wrapper: createWrapper() },
    );
    const input = {
      exerciseId: "exercise-1",
      weightKg: 100,
      achievedOn: "2026-01-01",
    };

    await waitFor(() => expect(result.current.recordsQuery.isSuccess).toBe(true));
    await act(() => result.current.createMutation.mutateAsync(input));
    await act(() =>
      result.current.updateMutation.mutateAsync({ recordId: "record-1", input }),
    );
    await act(() => result.current.deleteMutation.mutateAsync("record-1"));

    expect(serviceMocks.createManualPersonalRecord).toHaveBeenCalledWith("user-1", input);
    expect(serviceMocks.updateManualPersonalRecord).toHaveBeenCalledWith("record-1", input);
    expect(serviceMocks.deleteManualPersonalRecord).toHaveBeenCalledWith("record-1");
  });
});
