import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  LifeBuoy,
  MessageSquare,
  Star,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { cn } from "@/lib/utils";
import AdminStatCard from "@/features/admin/components/AdminStatCard";
import DashboardWidget from "@/features/admin/components/DashboardWidget";
import TicketStatusBadge from "@/features/admin/components/TicketStatusBadge";
import { AdminError } from "@/features/admin/components/AdminStates";
import {
  getDashboardStats,
  listFeedback,
  listTickets,
  listUsers,
} from "@/features/admin/services/admin";
import { feedbackTypeLabel } from "@/features/help/services/feedback";

const RECENT_LIMIT = 5;

const MODULE_LABELS: Record<string, string> = {
  fitness: "Fitness",
  productivity: "Productivity",
  finance: "Finance",
  general: "General",
};

const CATEGORY_LABELS: Record<string, string> = {
  question: "Question",
  bug: "Bug",
  feature_request: "Feature Request",
  other: "Other",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Short, human-friendly ticket reference derived from the row id. */
function ticketRef(id: string): string {
  return `#${id.slice(0, 8)}`;
}

/**
 * Admin operational overview: headline stats plus the newest users, latest
 * tickets and feedback, and quick actions. Each list reuses the same service and
 * React Query key as its dedicated page, so navigating there hits warm cache and
 * no query is duplicated; the dashboard just slices the top five.
 */
const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const statsQuery = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: getDashboardStats,
  });

  // Shared keys with AdminUsersPage / AdminTicketsPage / AdminFeedbackPage so the
  // portal fetches each dataset once and reuses it across pages.
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: listUsers,
  });
  const ticketsQuery = useQuery({
    queryKey: ["admin", "tickets", "all"],
    queryFn: () => listTickets(),
  });
  const feedbackQuery = useQuery({
    queryKey: ["admin", "feedback", "all", "all", "all", "all"],
    queryFn: () => listFeedback(),
  });

  const recentUsers = (usersQuery.data ?? []).slice(0, RECENT_LIMIT);
  const recentTickets = (ticketsQuery.data ?? []).slice(0, RECENT_LIMIT);
  const recentFeedback = (feedbackQuery.data ?? []).slice(0, RECENT_LIMIT);

  return (
    <div className="space-y-6">
      {/* Section 1 — System Overview */}
      {statsQuery.isPending ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : statsQuery.error ? (
        <AdminError
          message={
            statsQuery.error instanceof Error ? statsQuery.error.message : "Please try again."
          }
          onRetry={() => void statsQuery.refetch()}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <AdminStatCard label="Total Users" value={statsQuery.data.total_users} icon={Users} />
          <AdminStatCard label="New (7 days)" value={statsQuery.data.new_users_7d} icon={UserPlus} />
          <AdminStatCard label="Support Tickets" value={statsQuery.data.total_tickets} icon={LifeBuoy} />
          <AdminStatCard label="Pending Tickets" value={statsQuery.data.pending_tickets} icon={MessageSquare} />
          <AdminStatCard label="Feedback" value={statsQuery.data.feedback_count} icon={Star} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 2 — Newest Users */}
        <DashboardWidget
          title="Newest Users"
          icon={Users}
          viewAllLabel="View all users"
          onViewAll={() => navigate("/admin/users")}
          isPending={usersQuery.isPending}
          error={usersQuery.error}
          onRetry={() => void usersQuery.refetch()}
          isEmpty={recentUsers.length === 0}
          emptyTitle="No users yet."
        >
          {recentUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
              <ProfileAvatar
                avatarPath={user.avatar_url}
                fullName={user.full_name ?? "Member"}
                className="h-9 w-9 shrink-0"
                fallbackClassName="text-xs"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.full_name ?? "—"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user.email ?? "—"}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(user.created_at)}
              </span>
            </div>
          ))}
        </DashboardWidget>

        {/* Section 3 — Recent Support Tickets */}
        <DashboardWidget
          title="Recent Support Tickets"
          icon={LifeBuoy}
          viewAllLabel="View all tickets"
          onViewAll={() => navigate("/admin/tickets")}
          isPending={ticketsQuery.isPending}
          error={ticketsQuery.error}
          onRetry={() => void ticketsQuery.refetch()}
          isEmpty={recentTickets.length === 0}
          emptyTitle="No support tickets yet."
        >
          {recentTickets.map((ticket) => (
            <div key={ticket.id} className="rounded-xl px-1 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {ticketRef(ticket.id)}
                </span>
                <TicketStatusBadge status={ticket.status} />
              </div>
              <p className="mt-1 truncate text-sm font-medium text-foreground">{ticket.subject}</p>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(ticket.created_at)}</span>
              </div>
            </div>
          ))}
        </DashboardWidget>

        {/* Section 4 — Recent Feedback */}
        <DashboardWidget
          title="Recent Feedback"
          icon={Star}
          viewAllLabel="View all feedback"
          onViewAll={() => navigate("/admin/feedback")}
          isPending={feedbackQuery.isPending}
          error={feedbackQuery.error}
          onRetry={() => void feedbackQuery.refetch()}
          isEmpty={recentFeedback.length === 0}
          emptyTitle="No feedback yet."
        >
          {recentFeedback.map((item) => (
            <div key={item.id} className="rounded-xl px-1 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      size={12}
                      className={cn(
                        value <= item.rating ? "fill-primary text-primary" : "text-muted-foreground/40",
                      )}
                    />
                  ))}
                </span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {feedbackTypeLabel(item.feedback_type)}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {MODULE_LABELS[item.module] ?? item.module}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-foreground">
                {item.comment ? item.comment : <span className="italic text-muted-foreground">No comment</span>}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
            </div>
          ))}
        </DashboardWidget>

        {/* Section 5 — Quick Actions */}
        <GlassCard className="flex flex-col">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <Zap size={16} className="text-primary" />
            Quick Actions
          </h2>
          <div className="grid gap-2">
            {[
              { label: "Manage Users", icon: Users, route: "/admin/users" },
              { label: "Support Tickets", icon: LifeBuoy, route: "/admin/tickets" },
              { label: "Feedback", icon: Star, route: "/admin/feedback" },
            ].map((action) => (
              <button
                key={action.route}
                type="button"
                onClick={() => navigate(action.route)}
                className="flex items-center gap-3 rounded-xl bg-secondary/60 px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <action.icon size={16} />
                </span>
                {action.label}
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
