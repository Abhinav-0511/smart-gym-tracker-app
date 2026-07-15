import BrandLogo from "@/components/BrandLogo";
import { BRAND } from "@/lib/brand";

/**
 * Full-screen brand loader shown while the session/profile resolves. Uses the
 * LifeTrack app mark inside a rotating gradient ring with a soft pulsing glow —
 * a premium, on-brand replacement for a generic spinner.
 */
const AuthLoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-background p-4">
    <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
      <div className="relative h-24 w-24">
        <span className="brand-glow absolute -inset-2 rounded-full bg-primary/25 blur-2xl" />
        <span className="brand-ring absolute -inset-1 rounded-full" />
        <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[26px] bg-white shadow-lg ring-1 ring-border/50">
          <BrandLogo kind="app" className="h-[82%] w-[82%] max-w-none" />
        </span>
      </div>
      <p className="mt-6 text-sm font-semibold text-foreground">{BRAND.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">Loading your account…</p>
    </div>
  </div>
);

export default AuthLoadingScreen;
