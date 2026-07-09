import BrandLogo from "@/components/BrandLogo";

const AuthLoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-background">
    <div className="text-center" role="status" aria-live="polite">
      <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
        <BrandLogo className="h-[115%] w-[115%] max-w-none" />
      </div>
      <p className="text-sm text-muted-foreground mt-3">Loading your account…</p>
    </div>
  </div>
);

export default AuthLoadingScreen;
