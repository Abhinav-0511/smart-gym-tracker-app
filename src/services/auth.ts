import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  fullName: string;
}

const DUPLICATE_EMAIL_MESSAGE = "An account with this email already exists.";

export function getAuthErrorMessage(
  error: unknown,
  operation: "login" | "signup",
): string {
  const fallback =
    operation === "login"
      ? "Unable to log in right now. Please try again."
      : "Unable to create your account right now. Please try again.";

  if (!(error instanceof Error)) return fallback;

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
    return "Enter a valid email address.";
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

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
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
    email: email.trim(),
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
    email: email.trim(),
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

export async function logoutSession(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
