import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchRecentCheckins, saveCheckin } from "@/services/checkins";
import type { CheckinInput } from "@/types/checkin";

export const checkinKeys = {
  recent: (userId: string) => ["checkins", "recent", userId] as const,
};

export function useCheckin(userId: string | undefined) {
  const queryClient = useQueryClient();
  const resolvedUserId = userId ?? "";
  const queryKey = checkinKeys.recent(resolvedUserId);

  const recentCheckinsQuery = useQuery({
    queryKey,
    queryFn: () => fetchRecentCheckins(resolvedUserId),
    enabled: Boolean(userId),
  });

  const saveMutation = useMutation({
    mutationFn: (input: CheckinInput) => saveCheckin(resolvedUserId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { recentCheckinsQuery, saveMutation };
}
