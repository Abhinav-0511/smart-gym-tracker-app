import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { achievementKeys } from "@/hooks/useAchievements";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { reconcileAchievements } from "@/services/achievements";

const RECONCILE_INTERVAL_MS = 30_000;

const AchievementSync = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    let active = true;
    let running = false;

    const reconcile = async () => {
      if (!active || running) return;
      running = true;

      try {
        const result = await reconcileAchievements(user.id);
        if (!active) return;

        queryClient.setQueryData(achievementKeys.list(user.id), result.data);

        if (result.newlyUnlocked.length > 0) {
          const titles = result.newlyUnlocked
            .map((achievement) => achievement.title)
            .join(", ");
          toast({
            title:
              result.newlyUnlocked.length === 1
                ? "Achievement unlocked!"
                : `${result.newlyUnlocked.length} achievements unlocked!`,
            description: titles,
          });
        }
      } catch {
        // A later interval or visibility change safely retries reconciliation.
      } finally {
        running = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void reconcile();
      }
    };

    void reconcile();
    const interval = window.setInterval(() => void reconcile(), RECONCILE_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [queryClient, toast, user]);

  return null;
};

export default AchievementSync;
