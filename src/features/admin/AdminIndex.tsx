import { LayoutDashboard, LifeBuoy, LogOut, Star, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ProfileAvatar from "@/components/profile/ProfileAvatar";
import WorkspaceSwitcher from "@/components/workspace/WorkspaceSwitcher";
import { Button } from "@/components/ui/button";
import HelpButton from "@/features/help/components/HelpButton";
import { useAuth } from "@/hooks/useAuth";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminFeedbackPage from "./pages/AdminFeedbackPage";
import AdminTicketsPage from "./pages/AdminTicketsPage";
import AdminUsersPage from "./pages/AdminUsersPage";

export type AdminPage = "dashboard" | "users" | "tickets" | "feedback";

interface AdminNavItem {
  id: AdminPage;
  label: string;
  icon: LucideIcon;
  route: string;
}

const NAV_ITEMS: AdminNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/admin" },
  { id: "users", label: "User Management", icon: Users, route: "/admin/users" },
  { id: "tickets", label: "Support Tickets", icon: LifeBuoy, route: "/admin/tickets" },
  { id: "feedback", label: "Feedback", icon: Star, route: "/admin/feedback" },
];

interface AdminIndexProps {
  page: AdminPage;
}

/**
 * The Admin Portal shell. A standalone layout (not a workspace) with its own
 * navigation. Responsive: fixed sidebar on desktop, a scrollable tab bar on
 * mobile. Reuses the app's brand, avatar, Help and button primitives.
 */
const AdminIndex = ({ page }: AdminIndexProps) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const renderPage = () => {
    switch (page) {
      case "users":
        return <AdminUsersPage />;
      case "tickets":
        return <AdminTicketsPage />;
      case "feedback":
        return <AdminFeedbackPage />;
      case "dashboard":
      default:
        return <AdminDashboardPage />;
    }
  };

  const activeItem = NAV_ITEMS.find((item) => item.id === page);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-white/10 bg-[#0b2454] text-white md:flex">
        <div className="p-4">
          <WorkspaceSwitcher />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.route)}
              aria-current={page === item.id ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all",
                page === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-white/60 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="space-y-3 p-4">
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Sign out
          </button>
          <p className="text-center text-[10px] font-medium uppercase tracking-[.14em] text-white/35">
            {BRAND.poweredBy}
          </p>
        </div>
      </aside>

      <main className="md:ml-72">
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <WorkspaceSwitcher variant="compact" className="md:hidden" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                  {BRAND.name} Admin
                </p>
                <h1 className="text-base font-extrabold text-foreground md:text-lg">
                  {activeItem?.label ?? "Dashboard"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HelpButton pageKey="admin.dashboard" />
              <ProfileAvatar
                avatarPath={profile?.avatar_url}
                fullName={profile?.full_name ?? "Admin"}
                className="h-10 w-10 border-2 border-primary/50"
              />
            </div>
          </div>

          {/* Mobile tab bar */}
          <nav className="mx-auto mt-3 flex max-w-6xl gap-2 overflow-x-auto md:hidden">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.route)}
                aria-current={page === item.id ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition",
                  page === item.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="mx-auto max-w-6xl p-4 pb-16 md:p-8">{renderPage()}</div>

        {/* Mobile sign-out (sidebar is hidden) */}
        <div className="px-4 pb-10 md:hidden">
          <Button
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => void logout()}
          >
            <LogOut size={16} />
            Sign out
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AdminIndex;
