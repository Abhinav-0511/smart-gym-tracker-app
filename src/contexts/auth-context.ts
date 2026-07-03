import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

import type { LoginCredentials, SignupCredentials } from "@/services/auth";
import type { Profile, ProfileUpdate } from "@/services/profiles";

export interface SignupResult {
  emailConfirmationRequired: boolean;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<SignupResult>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<Profile>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
