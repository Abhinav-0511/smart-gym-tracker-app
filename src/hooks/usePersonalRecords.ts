import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createManualPersonalRecord,
  deleteManualPersonalRecord,
  detectPersonalRecords,
  fetchExerciseHistory,
  fetchPersonalRecords,
  updateManualPersonalRecord,
} from "@/services/personal-records";
import type { ManualPRInput } from "@/types/personal-record";

export const personalRecordKeys = {
  all: ["personal-records"] as const,
  list: (userId: string) => [...personalRecordKeys.all, userId] as const,
  history: (userId: string, exerciseId: string) =>
    [...personalRecordKeys.all, userId, "history", exerciseId] as const,
};

export function usePersonalRecords(
  userId: string | undefined,
  exerciseId: string | undefined,
) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";

  const recordsQuery = useQuery({
    queryKey: personalRecordKeys.list(resolvedUserId),
    queryFn: () => fetchPersonalRecords(resolvedUserId),
    enabled: Boolean(userId),
  });

  const historyQuery = useQuery({
    queryKey: personalRecordKeys.history(resolvedUserId, exerciseId ?? ""),
    queryFn: () => fetchExerciseHistory(resolvedUserId, exerciseId ?? ""),
    enabled: Boolean(userId && exerciseId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: personalRecordKeys.all,
    });

  const detectMutation = useMutation({
    mutationFn: () => detectPersonalRecords(resolvedUserId),
    onSuccess: invalidate,
  });

  const createMutation = useMutation({
    mutationFn: (input: ManualPRInput) =>
      createManualPersonalRecord(resolvedUserId, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      recordId,
      input,
    }: {
      recordId: string;
      input: ManualPRInput;
    }) => updateManualPersonalRecord(recordId, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteManualPersonalRecord,
    onSuccess: invalidate,
  });

  return {
    recordsQuery,
    historyQuery,
    detectMutation,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
