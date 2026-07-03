import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  fullName: string;
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
    throw error;
  }

  if (!data.user) {
    throw new Error("Your account could not be created. Please try again.");
  }

  return data.session;
}

export async function logoutSession(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
