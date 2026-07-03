import { Flame, LoaderCircle } from "lucide-react";

const AuthLoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-background">
    <div className="text-center" role="status" aria-live="polite">
      <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4 glow-primary">
        <Flame size={32} className="text-primary-foreground" />
      </div>
      <LoaderCircle size={22} className="mx-auto animate-spin text-primary" />
      <p className="text-sm text-muted-foreground mt-3">Loading your account…</p>
    </div>
  </div>
);

export default AuthLoadingScreen;
