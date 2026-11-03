import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { personalRecordKeys } from "@/hooks/usePersonalRecords";
import { detectPersonalRecords } from "@/services/personal-records";

const RECONCILE_INTERVAL_MS = 15_000;

const PersonalRecordSync = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    let active = true;
    let running = false;

    const reconcile = async () => {
      if (running || !active) return;
      running = true;

      try {
        const inserted = await detectPersonalRecords(user.id);
        if (inserted > 0 && active) {
          await queryClient.invalidateQueries({
            queryKey: personalRecordKeys.all,
          });
        }
      } catch {
        // The next interval or focus event safely retries reconciliation.
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
  }, [queryClient, user]);

  return null;
};

export default PersonalRecordSync;
