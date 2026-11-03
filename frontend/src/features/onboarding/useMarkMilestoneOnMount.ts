import { useEffect, useRef } from "react";

import { useSetMilestone, type MilestoneKey } from "@/features/onboarding/milestones";

/**
 * Records a one-time milestone when a page mounts — used by the "view X" checklist
 * steps (Progress, Reports). Fires at most once per component instance and is a
 * no-op if the flag is already set, so visiting the page repeatedly is cheap.
 */
export function useMarkMilestoneOnMount(key: MilestoneKey): void {
  const setMilestone = useSetMilestone();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    void setMilestone(key);
  }, [key, setMilestone]);
}
