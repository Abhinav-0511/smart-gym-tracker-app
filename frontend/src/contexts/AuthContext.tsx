import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import {
  AuthContext,
  type AuthContextValue,
  type SignupResult,
} from "@/contexts/auth-context";
import {
  getCurrentSession,
  loginWithPassword,
  logoutSession,
  signupWithPassword,
  subscribeToAuthChanges,
  type LoginCredentials,
  type SignupCredentials,
} from "@/services/auth";
import {
  cacheProfile,
  clearCachedProfile,
  getOrCreateProfile,
  readCachedProfile,
  updateProfile as persistProfile,
  type Profile,
  type ProfileUpdate,
} from "@/services/profiles";

interface AuthProviderProps {
  children: ReactNode;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Authentication is temporarily unavailable. Please try again.";
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const applySession = useCallback(async (nextSession: Session | null) => {
    const currentRequestId = ++requestId.current;

    setSession(nextSession);
    setError(null);

    if (!nextSession) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const nextProfile = await getOrCreateProfile(nextSession.user);
      cacheProfile(nextProfile);

      if (requestId.current === currentRequestId) {
        setProfile(nextProfile);
      }
    } catch (profileError) {
      // Offline / flaky network: the session is still valid (restored from
      // storage), so fall back to the last-known profile and let the app render.
      // The error screen is reserved for the case where we have nothing to show.
      const cachedProfile = readCachedProfile(nextSession.user.id);

      if (requestId.current === currentRequestId) {
        if (cachedProfile) {
          setProfile(cachedProfile);
          setError(null);
        } else {
          setProfile(null);
          setError(getErrorMessage(profileError));
        }
      }
    } finally {
      if (requestId.current === currentRequestId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    const subscription = subscribeToAuthChanges((event, nextSession) => {
      if (event === "INITIAL_SESSION") {
        return;
      }

      window.setTimeout(() => {
        if (active) {
          void applySession(nextSession);
        }
      }, 0);
    });

    void getCurrentSession()
      .then((currentSession) => {
        if (active) {
          return applySession(currentSession);
        }
      })
      .catch((sessionError: unknown) => {
        if (active) {
          setError(getErrorMessage(sessionError));
          setLoading(false);
        }
      });

    return () => {
      active = false;
      requestId.current += 1;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setError(null);
      const nextSession = await loginWithPassword(credentials);
      await applySession(nextSession);
    },
    [applySession],
  );

  const signup = useCallback(
    async (credentials: SignupCredentials): Promise<SignupResult> => {
      setError(null);
      const nextSession = await signupWithPassword(credentials);

      if (nextSession) {
        await applySession(nextSession);
      }

      return {
        emailConfirmationRequired: nextSession === null,
      };
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    setError(null);
    const signedOutUserId = session?.user.id;
    await logoutSession();
    if (signedOutUserId) {
      clearCachedProfile(signedOutUserId);
    }
    await applySession(null);
  }, [applySession, session]);

  const refreshProfile = useCallback(async () => {
    if (!session) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextProfile = await getOrCreateProfile(session.user);
      cacheProfile(nextProfile);
      setProfile(nextProfile);
    } catch (profileError) {
      const cachedProfile = readCachedProfile(session.user.id);
      if (cachedProfile) {
        setProfile(cachedProfile);
        setError(null);
      } else {
        setProfile(null);
        setError(getErrorMessage(profileError));
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  const updateProfile = useCallback(
    async (updates: ProfileUpdate): Promise<Profile> => {
      if (!session || !profile) {
        throw new Error("A signed-in profile is required to save changes.");
      }

      const previousProfile = profile;
      setProfile({ ...previousProfile, ...updates });

      try {
        const savedProfile = await persistProfile(session.user.id, updates);
        cacheProfile(savedProfile);
        setProfile(savedProfile);
        return savedProfile;
      } catch (updateError) {
        setProfile(previousProfile);
        throw updateError;
      }
    },
    [profile, session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      error,
      login,
      signup,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [
      error,
      loading,
      login,
      logout,
      profile,
      refreshProfile,
      session,
      signup,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
