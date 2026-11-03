import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;
export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | "full_name"
    | "avatar_url"
    | "fitness_goal"
    | "experience_level"
    | "height_cm"
    | "timezone"
    | "theme"
    | "onboarding_completed_at"
    | "milestones"
  >
>;

function getProfileName(user: User): string {
  const metadataName = user.user_metadata.full_name;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim().slice(0, 100);
  }

  const emailName = user.email?.split("@")[0]?.trim();
  return emailName ? emailName.slice(0, 100) : "Member";
}

// ---------------------------------------------------------------------------
// Local profile cache. The signed-in profile is the one piece of state the whole
// app is gated behind (see ProtectedRoute), yet it is fetched from Supabase on
// every boot. Persisting the last-known profile lets an already-signed-in user
// open the installed app offline and land in the app instead of the "couldn't
// load your profile" screen. It is a convenience cache only — the network copy
// is always authoritative and overwrites it whenever a fetch succeeds.
// ---------------------------------------------------------------------------
const PROFILE_CACHE_PREFIX = "lifetrack.profile.";

function profileCacheKey(userId: string): string {
  return `${PROFILE_CACHE_PREFIX}${userId}`;
}

export function cacheProfile(profile: Profile): void {
  try {
    localStorage.setItem(profileCacheKey(profile.id), JSON.stringify(profile));
  } catch {
    // Storage may be unavailable (private mode / quota) — caching is best-effort.
  }
}

export function readCachedProfile(userId: string): Profile | null {
  try {
    const raw = localStorage.getItem(profileCacheKey(userId));
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function clearCachedProfile(userId: string): void {
  try {
    localStorage.removeItem(profileCacheKey(userId));
  } catch {
    // Ignore — nothing actionable if removal fails.
  }
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function getBrowserTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone && timezone.trim() ? timezone : "UTC";
  } catch {
    return "UTC";
  }
}

export async function getOrCreateProfile(user: User): Promise<Profile> {
  const existingProfile = await fetchProfile(user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: getProfileName(user),
      timezone: getBrowserTimezone(),
    },
    {
      onConflict: "id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    throw error;
  }

  const createdProfile = await fetchProfile(user.id);

  if (!createdProfile) {
    throw new Error("Your profile could not be loaded after account creation.");
  }

  return createdProfile;
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
