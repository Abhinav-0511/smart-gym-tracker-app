import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type Announcement = Tables<"announcements">;

/**
 * The latest active announcement the current user has not seen yet, or null when
 * there is nothing new. Backed by a SECURITY DEFINER RPC so the "unseen" filter
 * runs in the database in a single round-trip.
 */
export async function getUnseenAnnouncement(): Promise<Announcement | null> {
  const { data, error } = await supabase.rpc("get_unseen_announcement");
  if (error) throw error;
  return (data as Announcement | null) ?? null;
}

/** Record that the current user has seen an announcement so it never reappears. */
export async function markAnnouncementSeen(announcementId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_announcement_seen", {
    p_announcement_id: announcementId,
  });
  if (error) throw error;
}
