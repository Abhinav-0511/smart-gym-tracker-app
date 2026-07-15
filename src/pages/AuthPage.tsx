import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";

import BrandLogo from "@/components/BrandLogo";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BRAND } from "@/lib/brand";
import { getAuthErrorMessage, isValidEmailAddress, normalizeEmailAddress, requestPasswordReset } from "@/services/auth";

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
  const [showSplash, setShowSplash] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordSubmitting, setForgotPasswordSubmitting] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setShowSplash(false), reduceMotion ? 300 : 2600);
    return () => window.clearTimeout(timer);
  }, []);

  const switchMode = (loginMode: boolean) => {
    if (submitting || forgotPasswordSubmitting) return;

    setIsLogin(loginMode);
    setIsForgotPassword(false);
    setForgotPasswordSent(false);
    setError(null);
    setConfirmationEmail(null);
  };

  const emailFieldState = useMemo(() => {
    const normalizedEmail = normalizeEmailAddress(email);
    if (!normalizedEmail) {
      return { invalid: false, message: null };
    }

    return {
      invalid: !isValidEmailAddress(normalizedEmail),
      message: !isValidEmailAddress(normalizedEmail) ? "Please enter a valid email address." : null,
    };
  }, [email]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    const normalizedEmail = normalizeEmailAddress(email);
    const normalizedFullName = fullName.trim();

    if (!normalizedEmail || !password || (!isLogin && !normalizedFullName)) {
      setError("Please complete all required fields.");
      return;
    }

    if (!isValidEmailAddress(normalizedEmail)) {
      setError("Please enter a valid email address.");
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
            description: `Your ${BRAND.name} account is ready.`,
          });
        }
      }
    } catch (submitError) {
      const message = getAuthErrorMessage(
        submitError,
        isLogin ? "login" : "signup",
      );
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

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (forgotPasswordSubmitting) return;

    const normalizedEmail = normalizeEmailAddress(email);

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!isValidEmailAddress(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setForgotPasswordSubmitting(true);
    setError(null);

    try {
      await requestPasswordReset(normalizedEmail);
      setForgotPasswordSent(true);
    } catch (submitError) {
      const message = getAuthErrorMessage(submitError, "forgot-password");
      setError(message);
    } finally {
      setForgotPasswordSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background md:grid md:grid-cols-[1.15fr_.85fr]">
      {showSplash && (
        <div
          className="mobile-splash bg-brand-navy fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-8 text-center text-white md:hidden"
          role="status"
          aria-label={`Opening ${BRAND.name}`}
        >
          <div className="pointer-events-none absolute left-1/2 top-[38%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl brand-glow" />
          <div className="relative flex flex-col items-center">
            <div className="brand-reveal relative mb-8 h-28 w-28">
              <span className="brand-glow absolute -inset-3 rounded-[36px] bg-primary/30 blur-2xl" />
              <span className="brand-float relative flex h-full w-full items-center justify-center overflow-hidden rounded-[30px] bg-white shadow-2xl ring-1 ring-white/40">
                <BrandLogo kind="app" className="h-[84%] w-[84%] max-w-none" />
              </span>
            </div>
            <h1 className="splash-item splash-delay-1 text-[2.75rem] font-extrabold leading-none tracking-tight">
              {BRAND.name}
            </h1>
            <p className="splash-item splash-delay-2 mt-4 max-w-xs text-[0.95rem] leading-6 text-white/70">
              {BRAND.motto}
            </p>
          </div>
          <p className="splash-item splash-delay-4 absolute inset-x-0 bottom-9 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[.16em] text-white/45">
            <ShieldCheck size={13} /> {BRAND.poweredBy}
          </p>
        </div>
      )}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <section className="auth-hero bg-brand-navy relative hidden min-h-screen flex-col justify-between overflow-hidden p-12 text-white md:flex">
        <div className="auth-orbit absolute -right-20 top-6 h-60 w-60 rounded-full border border-primary/20 md:-right-24 md:top-24 md:h-80 md:w-80" />
        <div className="auth-orbit auth-orbit-delayed absolute -right-4 top-16 h-60 w-60 rounded-full border border-primary/10 md:-right-8 md:top-40 md:h-80 md:w-80" />
        <div className="auth-reveal flex h-14 w-fit items-center justify-center rounded-2xl bg-white px-5 shadow-xl">
          <BrandLogo kind="full" className="h-8 w-auto max-w-[190px]" />
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="auth-reveal auth-delay-1 mb-4 hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-semibold text-primary sm:inline-flex md:mb-8">
            <Sparkles size={14} /> Three pillars. One premium space.
          </div>
          <h2 className="auth-reveal auth-delay-2 text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl">
            Your <span className="text-gradient">fitness</span>, <span className="text-gradient">focus</span> <span className="md:block">and <span className="text-gradient">finances</span></span><br className="md:hidden" /> — beautifully in sync.
          </h2>
          <p className="auth-reveal auth-delay-3 mt-3 max-w-md text-sm leading-6 text-white/65 md:mt-6 md:text-base md:leading-7">
            {BRAND.motto} One account for every pillar of your life — plan, build habits, and grow your money in a single premium space.
          </p>
        </div>
        <p className="auth-reveal auth-delay-4 hidden items-center gap-2 text-xs text-white/45 md:flex"><ShieldCheck size={14} /> {BRAND.poweredBy}</p>
      </section>
      <div className="login-reveal relative flex min-h-screen items-center justify-center px-4 py-10 md:px-8">
      <div className="w-full max-w-md space-y-7 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] bg-white shadow-xl ring-1 ring-border/50">
            <BrandLogo kind="app" className="h-[112%] w-[112%] max-w-none" />
          </div>
          <div className="mx-auto flex h-11 w-fit items-center justify-center rounded-2xl bg-white px-4 shadow-sm ring-1 ring-border/50">
            <BrandLogo kind="full" className="h-6 w-auto max-w-[160px]" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">
            {isLogin ? "Welcome back" : `Welcome to ${BRAND.name}`}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{BRAND.motto}</p>
        </div>

        <GlassCard className="p-5 sm:p-7">
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
          ) : isForgotPassword ? (
            <form onSubmit={handleForgotPassword}>
              <div className="mb-5 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotPasswordSent(false);
                    setError(null);
                  }}
                  aria-label="Back to sign in"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Reset your password</h2>
                  <p className="text-sm text-muted-foreground">We’ll send a secure link to your inbox.</p>
                </div>
              </div>

              {forgotPasswordSent ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-foreground" role="status">
                  <p className="font-medium">If an account exists for this email, a password reset link has been sent.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="forgot-email" className="text-sm font-medium text-foreground block mb-1.5">
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      enterKeyHint="go"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="alex@example.com"
                      disabled={forgotPasswordSubmitting}
                      aria-invalid={emailFieldState.invalid}
                      aria-describedby={emailFieldState.invalid ? "forgot-email-error" : undefined}
                      className="w-full rounded-2xl border border-input bg-secondary/60 px-4 py-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground disabled:opacity-60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {error && (
                    <p id="forgot-email-error" className="text-sm text-destructive mt-4" role="alert">
                      {error}
                    </p>
                  )}

                  <Button size="lg" type="submit" className="w-full mt-6" disabled={forgotPasswordSubmitting}>
                    {forgotPasswordSubmitting && <LoaderCircle size={16} className="animate-spin" />}
                    {forgotPasswordSubmitting ? "Sending…" : "Send reset link"}
                  </Button>
                </>
              )}
            </form>
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
                      autoCapitalize="words"
                      enterKeyHint="next"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Alex Johnson"
                      disabled={submitting}
                      className="w-full rounded-2xl border border-input bg-secondary/60 px-4 py-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground disabled:opacity-60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
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
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="alex@example.com"
                    disabled={submitting}
                    aria-invalid={emailFieldState.invalid}
                    className="w-full rounded-2xl border border-input bg-secondary/60 px-4 py-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground disabled:opacity-60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
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
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      enterKeyHint="done"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
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
              </div>

              {error && (
                <p className="text-sm text-destructive mt-4" role="alert">
                  {error}
                </p>
              )}

              {isLogin && (
                <button
                  type="button"
                  className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                    setConfirmationEmail(null);
                  }}
                >
                  Forgot Password?
                </button>
              )}

              <Button size="lg" type="submit" className="w-full mt-6" disabled={submitting}>
                {submitting && <LoaderCircle size={16} className="animate-spin" />}
                {submitting ? "Please wait…" : isLogin ? "Log In" : "Create Account"}
              </Button>
            </form>
          )}
        </GlassCard>
        <p className="text-center text-[11px] font-medium uppercase tracking-[.16em] text-muted-foreground/70">
          {BRAND.poweredBy}
        </p>
      </div>
      </div>
    </div>
  );
};

export default AuthPage;
