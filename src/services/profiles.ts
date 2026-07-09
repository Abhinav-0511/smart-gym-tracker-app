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
