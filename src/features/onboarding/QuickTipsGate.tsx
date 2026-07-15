import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "./useOnboarding";
import { useQuickTips } from "./useQuickTips";

const QuickTips = lazy(() => import("./QuickTips"));

/**
 * Shows the one-time "find your way around" popup once, immediately after the
 * first-run carousel is finished. It waits for onboarding to be complete so the
 * two never overlap, and stays off the public/auth and admin surfaces.
 */
const QuickTipsGate = () => {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const { shouldShow: onboardingActive } = useOnboarding();
  const { seen, dismiss } = useQuickTips();

  const onSuppressedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/reset-password") ||
    pathname === "/";

  // Only after the carousel is done (onboarding stamped) and outside admin/auth.
  const show =
    Boolean(profile) &&
    Boolean(profile?.onboarding_completed_at) &&
    !onboardingActive &&
    !seen &&
    !onSuppressedRoute;

  if (!show) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <QuickTips open onDismiss={dismiss} />
    </Suspense>
  );
};

export default QuickTipsGate;
