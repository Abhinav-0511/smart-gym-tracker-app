import { useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, Flame, LoaderCircle } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Something went wrong. Please try again.";
  }

  if (error.message.toLowerCase().includes("invalid login credentials")) {
    return "The email or password you entered is incorrect.";
  }

  if (error.message.toLowerCase().includes("email not confirmed")) {
    return "Please confirm your email address before logging in.";
  }

  return error.message;
}

const AuthPage = () => {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const switchMode = (loginMode: boolean) => {
    if (submitting) return;

    setIsLogin(loginMode);
    setError(null);
    setConfirmationEmail(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    const normalizedEmail = email.trim();
    const normalizedFullName = fullName.trim();

    if (!normalizedEmail || !password || (!isLogin && !normalizedFullName)) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setConfirmationEmail(null);

    try {
      if (isLogin) {
        await login({ email: normalizedEmail, password });
        toast({
          title: "Welcome back",
          description: "You’re now signed in.",
        });
      } else {
        const result = await signup({
          fullName: normalizedFullName,
          email: normalizedEmail,
          password,
        });

        if (result.emailConfirmationRequired) {
          setConfirmationEmail(normalizedEmail);
        } else {
          toast({
            title: "Account created",
            description: "Your FitTrack account is ready.",
          });
        }
      }
    } catch (submitError) {
      const message = getErrorMessage(submitError);
      setError(message);
      toast({
        variant: "destructive",
        title: isLogin ? "Couldn’t log in" : "Couldn’t create account",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4 glow-primary">
            <Flame size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">FitTrack</h1>
          <p className="text-muted-foreground text-sm mt-1">Your premium gym companion</p>
        </div>

        <GlassCard className="p-6">
          <div className="flex bg-secondary rounded-xl p-1 mb-6">
            <button
              type="button"
              disabled={submitting}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => switchMode(true)}
            >
              Log In
            </button>
            <button
              type="button"
              disabled={submitting}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => switchMode(false)}
            >
              Sign Up
            </button>
          </div>

          {confirmationEmail ? (
            <div className="text-center py-3" role="status">
              <CheckCircle2 size={32} className="text-primary mx-auto mb-3" />
              <h2 className="font-semibold text-foreground">Check your email</h2>
              <p className="text-sm text-muted-foreground mt-2">
                We sent a confirmation link to {confirmationEmail}. Confirm your address, then
                return here to continue.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-5"
                onClick={() => switchMode(true)}
              >
                Back to Log In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {!isLogin && (
                  <div>
                    <label htmlFor="full-name" className="text-sm font-medium text-foreground block mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="full-name"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Alex Johnson"
                      disabled={submitting}
                      className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground disabled:opacity-60"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-foreground block mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="alex@example.com"
                    disabled={submitting}
                    className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="text-sm font-medium text-foreground block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      disabled={submitting}
                      className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground pr-10 disabled:opacity-60"
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
              </div>

              {error && (
                <p className="text-sm text-destructive mt-4" role="alert">
                  {error}
                </p>
              )}

              <Button size="lg" type="submit" className="w-full mt-6" disabled={submitting}>
                {submitting && <LoaderCircle size={16} className="animate-spin" />}
                {submitting ? "Please wait…" : isLogin ? "Log In" : "Create Account"}
              </Button>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default AuthPage;
