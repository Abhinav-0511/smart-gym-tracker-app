import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { env } from "@/config/env";
import { supabase } from "@/lib/supabase";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  fullName: string;
}

const DUPLICATE_EMAIL_MESSAGE = "An account with this email already exists.";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailAddress(email: string): boolean {
  return EMAIL_REGEX.test(normalizeEmailAddress(email));
}

function getErrorCategory(error: unknown): "network" | "server" | "authentication" | "validation" | "unknown" {
  if (!(error instanceof Error)) {
    return "unknown";
  }

  const message = error.message.toLowerCase();
  const code = "code" in error && typeof error.code === "string" ? error.code.toLowerCase() : "";

  if (message.includes("invalid email") || code === "email_address_invalid") {
    return "validation";
  }

  if (
    message.includes("failed to fetch")
    || message.includes("network")
    || message.includes("offline")
    || message.includes("socket")
    || message.includes("load failed")
  ) {
    return "network";
  }

  if (message.includes("500") || message.includes("internal server") || message.includes("server error")) {
    return "server";
  }

  if (message.includes("invalid login credentials") || message.includes("email not confirmed")) {
    return "authentication";
  }

  return "unknown";
}

export function getAuthErrorMessage(
  error: unknown,
  operation: "login" | "signup" | "forgot-password" | "reset-password",
): string {
  const fallback =
    operation === "login"
      ? "Unable to log in right now. Please try again."
      : operation === "forgot-password"
        ? "We couldn’t send a reset link right now. Please try again."
        : operation === "reset-password"
          ? "We couldn’t update your password right now. Please try again."
          : "Unable to create your account right now. Please try again.";

  if (!(error instanceof Error)) return fallback;

  const category = getErrorCategory(error);

  if (category === "network") {
    return "Unable to connect. Please check your internet connection and try again.";
  }

  if (category === "server") {
    return "We’re having trouble reaching the service right now. Please try again in a moment.";
  }

  const message = error.message.toLowerCase();
  const code =
    "code" in error && typeof error.code === "string"
      ? error.code.toLowerCase()
      : "";

  if (
    code === "user_already_exists"
    || message.includes("user already registered")
    || message.includes("already been registered")
    || message.includes("account with this email already exists")
  ) {
    return DUPLICATE_EMAIL_MESSAGE;
  }

  if (message.includes("invalid login credentials")) {
    return "The email or password you entered is incorrect.";
  }

  if (message.includes("email not confirmed")) {
    return "Please confirm your email address before logging in.";
  }

  if (code === "email_address_invalid" || message.includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  if (code === "weak_password" || message.includes("password should be")) {
    return "Choose a stronger password and try again.";
  }

  if (code === "over_email_send_rate_limit" || message.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (message.includes("signup is disabled")) {
    return "Account registration is temporarily unavailable.";
  }

  return error.message || fallback;
}

/** Rejects if `promise` hasn't settled within `ms` (the promise itself keeps running). */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Request timed out")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Reads the persisted Supabase session straight from storage, with no network.
 * Used when offline: `getSession()` tries to refresh an expired token and keeps
 * retrying with backoff, which would hold the launch screen indefinitely.
 */
function readStoredSession(): Session | null {
  try {
    const ref = new URL(env.supabaseUrl).hostname.split(".")[0];
    const raw = window.localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session | null;
    return parsed?.user && parsed.access_token ? parsed : null;
  } catch {
    return null;
  }
}

const SESSION_TIMEOUT_MS = 4000;

export async function getCurrentSession(): Promise<Session | null> {
  // Offline: don't wait on a token refresh that cannot succeed.
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return readStoredSession();
  }

  try {
    const { data, error } = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS);
    if (error) throw error;
    return data.session;
  } catch (error) {
    // Slow / "connected but no internet" network: fall back to the stored session
    // so the app can open from its local caches instead of spinning forever.
    const stored = readStoredSession();
    if (stored) return stored;
    throw error;
  }
}

export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange(callback).data.subscription;
}

export async function loginWithPassword({
  email,
  password,
}: LoginCredentials): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmailAddress(email),
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error("Login succeeded but no session was created.");
  }

  return data.session;
}

export async function signupWithPassword({
  fullName,
  email,
  password,
}: SignupCredentials): Promise<Session | null> {
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmailAddress(email),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    throw new Error(getAuthErrorMessage(error, "signup"));
  }

  if (!data.user) {
    throw new Error("Your account could not be created. Please try again.");
  }

  // With email confirmation enabled, Supabase intentionally returns an
  // obfuscated user for an existing address. An empty identities collection
  // is the documented signal that no new email identity was created.
  if (data.user.identities?.length === 0) {
    throw new Error(DUPLICATE_EMAIL_MESSAGE);
  }

  return data.session;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = normalizeEmailAddress(email);

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw new Error(getAuthErrorMessage(error, "forgot-password"));
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw new Error(getAuthErrorMessage(error, "reset-password"));
  }
}

export async function logoutSession(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
