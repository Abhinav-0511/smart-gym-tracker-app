import { useQuery } from "@tanstack/react-query";

import { fetchAchievements } from "@/services/achievements";

export const achievementKeys = {
  all: ["achievements"] as const,
  list: (userId: string) => [...achievementKeys.all, userId] as const,
};

export function useAchievements(userId: string | undefined) {
  const resolvedUserId = userId ?? "";

  return useQuery({
    queryKey: achievementKeys.list(resolvedUserId),
    queryFn: () => fetchAchievements(resolvedUserId),
    enabled: Boolean(userId),
  });
}
