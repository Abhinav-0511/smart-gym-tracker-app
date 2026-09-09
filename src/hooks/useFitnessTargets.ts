import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchFitnessTargets, saveFitnessTargets } from "@/services/fitness-targets";
import type { FitnessTargetsInput } from "@/types/checkin";

export const fitnessTargetsKeys = {
  detail: (userId: string) => ["fitness-targets", userId] as const,
};

export function useFitnessTargets(userId: string | undefined) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";
  const queryKey = fitnessTargetsKeys.detail(resolvedUserId);

  const targetsQuery = useQuery({
    queryKey,
    queryFn: () => fetchFitnessTargets(resolvedUserId),
    enabled: Boolean(userId),
  });

  const saveMutation = useMutation({
    mutationFn: (input: FitnessTargetsInput) => saveFitnessTargets(resolvedUserId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { targetsQuery, saveMutation };
}
