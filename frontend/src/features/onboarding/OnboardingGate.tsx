import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";

import { useOnboarding } from "./useOnboarding";

const OnboardingCarousel = lazy(() => import("./OnboardingCarousel"));

/**
 * Mounts the first-run tour exactly once for the whole app. It renders nothing
 * until a loaded profile is missing its onboarding stamp, and never over the
 * public auth pages or the admin portal. Placed high in the tree so it overlays
 * whichever workspace the new user lands on.
 */
const OnboardingGate = () => {
  const { pathname } = useLocation();
  const { shouldShow, dismiss } = useOnboarding();

  const onSuppressedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/reset-password") ||
    pathname === "/";

  if (!shouldShow || onSuppressedRoute) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <OnboardingCarousel onComplete={() => void dismiss()} />
    </Suspense>
  );
};

export default OnboardingGate;
