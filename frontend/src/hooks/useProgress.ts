import { useQuery } from "@tanstack/react-query";

import { fetchProgressData } from "@/services/progress";

export const progressKeys = {
  data: (userId: string, timezone: string) =>
    ["progress", userId, timezone] as const,
};

export function useProgress(userId: string | undefined, timezone: string) {
  const resolvedUserId = userId ?? "";

  return useQuery({
    queryKey: progressKeys.data(resolvedUserId, timezone),
    queryFn: () => fetchProgressData(resolvedUserId, timezone),
    enabled: Boolean(userId),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
