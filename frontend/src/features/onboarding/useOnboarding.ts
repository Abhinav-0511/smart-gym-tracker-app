import { useCallback, useState } from "react";

import { useAuth } from "@/hooks/useAuth";

/**
 * Drives the first-run onboarding overlay. It appears once, right after account
 * creation, whenever a loaded profile has no `onboarding_completed_at`. Both
 * finishing and skipping stamp that column, so it never shows again (resetting =
 * clearing the column in the database).
 */
export function useOnboarding() {
  const { profile, updateProfile } = useAuth();
  const [dismissing, setDismissing] = useState(false);

  const shouldShow = Boolean(profile) && !profile?.onboarding_completed_at;

  const dismiss = useCallback(async () => {
    if (!profile || profile.onboarding_completed_at || dismissing) {
      return;
    }
    setDismissing(true);
    try {
      await updateProfile({ onboarding_completed_at: new Date().toISOString() });
    } catch {
      // If persistence fails, allow the overlay to reappear next load rather than
      // silently trapping the user — it will retry then.
      setDismissing(false);
    }
  }, [dismissing, profile, updateProfile]);

  return { shouldShow, dismiss };
}
