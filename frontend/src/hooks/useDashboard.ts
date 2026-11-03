import { useQuery } from "@tanstack/react-query";

import { usePersonalRecords } from "@/hooks/usePersonalRecords";
import { useWorkoutPlans } from "@/hooks/useWorkoutPlans";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { fetchDashboardWorkoutAggregate } from "@/services/dashboard";

export const dashboardKeys = {
  aggregate: (userId: string, timezone: string) =>
    ["dashboard", "aggregate", userId, timezone] as const,
};

export function useDashboard(userId: string | undefined, timezone: string) {
  const resolvedUserId = userId ?? "";
  const { plansQuery } = useWorkoutPlans(userId);
  const { sessionQuery } = useWorkoutSession(userId);
  const { recordsQuery } = usePersonalRecords(userId, undefined);
  const aggregateQuery = useQuery({
    queryKey: dashboardKeys.aggregate(resolvedUserId, timezone),
    queryFn: () => fetchDashboardWorkoutAggregate(resolvedUserId, timezone),
    enabled: Boolean(userId),
  });

  return {
    plansQuery,
    sessionQuery,
    recordsQuery,
    aggregateQuery,
    isPending:
      plansQuery.isPending
      || sessionQuery.isPending
      || recordsQuery.isPending
      || aggregateQuery.isPending,
    error:
      plansQuery.error
      || sessionQuery.error
      || recordsQuery.error
      || aggregateQuery.error,
  };
}
