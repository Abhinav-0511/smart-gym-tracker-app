import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { achievementKeys } from "@/hooks/useAchievements";
import {
  fetchCurrentBodyWeight,
  upsertCurrentBodyWeight,
  type BodyWeightEntry,
} from "@/services/body-weights";

export const bodyWeightKeys = {
  all: ["body-weight"] as const,
  current: (userId: string) => [...bodyWeightKeys.all, userId, "current"] as const,
};

export function useCurrentBodyWeight(userId: string | undefined) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";
  const queryKey = bodyWeightKeys.current(resolvedUserId);

  const currentWeightQuery = useQuery({
    queryKey,
    queryFn: () => fetchCurrentBodyWeight(resolvedUserId),
    enabled: Boolean(userId),
  });

  const updateWeightMutation = useMutation({
    mutationFn: (entry: BodyWeightEntry) =>
      upsertCurrentBodyWeight(resolvedUserId, entry),
    onMutate: async (entry) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BodyWeightEntry | null>(queryKey);
      queryClient.setQueryData<BodyWeightEntry>(queryKey, entry);
      return { previous };
    },
    onError: (_error, _entry, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? null);
    },
    onSuccess: (entry) => {
      queryClient.setQueryData(queryKey, entry);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["progress"] }),
        queryClient.invalidateQueries({ queryKey: achievementKeys.all }),
      ]);
    },
  });

  return {
    currentWeightQuery,
    updateWeightMutation,
  };
}
