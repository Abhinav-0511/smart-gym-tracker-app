import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import BrandLogo from "@/components/BrandLogo";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAuthErrorMessage, updatePassword } from "@/services/auth";
import { supabase } from "@/lib/supabase";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState<"checking" | "ready" | "missing">("checking");

  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setRecoveryReady(session ? "ready" : "checking");
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setRecoveryReady("missing");
        setError("This recovery link is no longer valid. Please request a new one.");
        return;
      }

      setRecoveryReady(data.session ? "ready" : "missing");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    if (!newPassword || !confirmPassword) {
      setError("Please complete both password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await updatePassword(newPassword);
      await supabase.auth.signOut();
      setSuccess(true);
      toast({
        title: "Password updated",
        description: "You can sign in with your new password now.",
      });
      navigate("/auth", { replace: true });
    } catch (submitError) {
      const message = getAuthErrorMessage(submitError, "reset-password");
      setError(message);
      toast({
        variant: "destructive",
        title: "Couldn’t update password",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] bg-white shadow-xl">
            <BrandLogo className="h-[115%] w-[115%] max-w-none" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Create a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a strong password to secure your account.</p>
        </div>

        <GlassCard className="p-5 sm:p-7">
          {recoveryReady === "checking" ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <LoaderCircle className="animate-spin" size={16} />
              Verifying your recovery link…
            </div>
          ) : recoveryReady === "missing" ? (
            <div className="space-y-3 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">Recovery link unavailable</h2>
              <p className="text-sm text-muted-foreground">
                This link has expired or could not be validated. Please request a fresh password reset email.
              </p>
              <Button className="w-full" onClick={() => navigate("/auth", { replace: true })}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="new-password">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="••••••••"
                    disabled={submitting}
                    className="w-full rounded-2xl border border-input bg-secondary/60 px-4 py-3.5 pr-10 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground disabled:opacity-60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={submitting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="confirm-password">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                  className="w-full rounded-2xl border border-input bg-secondary/60 px-4 py-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground disabled:opacity-60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              {success && (
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-sm text-foreground" role="status">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary" size={16} />
                    Password updated successfully.
                  </div>
                </div>
              )}

              <Button className="w-full" disabled={submitting} size="lg" type="submit">
                {submitting && <LoaderCircle className="animate-spin" size={16} />}
                {submitting ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
