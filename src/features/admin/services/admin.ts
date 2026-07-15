import { supabase } from "@/lib/supabase";
import type {
  Feedback,
  FeedbackModule,
  FeedbackType,
} from "@/features/help/services/feedback";
import type { SupportTicket } from "@/features/help/services/support";

/**
 * Admin data access. Reads that need auth.users data (dashboard counters, the
 * user directory) go through SECURITY DEFINER RPCs that self-check is_admin();
 * tickets and feedback are read directly — their RLS policies already grant
 * admins a full-table view. Every path is a no-op for non-admins at the DB level.
 */

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface AdminRecentActivity {
  kind: "ticket" | "feedback";
  id: string;
  title: string;
  detail: string;
  status: string;
  created_at: string;
}

export interface AdminDashboardStats {
  total_users: number;
  new_users_7d: number;
  total_tickets: number;
  pending_tickets: number;
  feedback_count: number;
  recent_activity: AdminRecentActivity[];
}

export interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  workout_count: number;
  habit_count: number;
  transaction_count: number;
}

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw error;
  return data as unknown as AdminDashboardStats;
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return (data as unknown as AdminUser[]) ?? [];
}

export async function listTickets(
  status?: TicketStatus,
): Promise<SupportTicket[]> {
  let query = supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function updateTicket(
  id: string,
  updates: { status?: TicketStatus; admin_reply?: string | null },
): Promise<SupportTicket> {
  const { data, error } = await supabase
    .from("support_tickets")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export interface FeedbackFilters {
  rating?: number;
  feedbackType?: FeedbackType;
  module?: FeedbackModule;
  /** Inclusive lower bound on created_at (ISO string) for the date filter. */
  since?: string;
}

export async function listFeedback(
  filters: FeedbackFilters = {},
): Promise<Feedback[]> {
  // Filters compose: each narrows the same query, and results stay newest-first.
  let query = supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.rating) {
    query = query.eq("rating", filters.rating);
  }
  if (filters.feedbackType) {
    query = query.eq("feedback_type", filters.feedbackType);
  }
  if (filters.module) {
    query = query.eq("module", filters.module);
  }
  if (filters.since) {
    query = query.gte("created_at", filters.since);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
