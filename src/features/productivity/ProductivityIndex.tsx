import { lazy, Suspense, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocation, useNavigate } from "react-router-dom";

import BottomNav from "@/components/BottomNav";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import SidebarNav from "@/components/Sidebar";
import PageSkeleton from "@/components/ui/page-skeleton";
import WorkspaceSwitcher from "@/components/workspace/WorkspaceSwitcher";
import ProductivityNotificationCenter from "@/features/productivity/components/ProductivityNotificationCenter";
import ProductivitySearch from "@/features/productivity/components/ProductivitySearch";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { resolveActivePage } from "@/features/workspace/workspace-registry";
import CalendarPage from "./pages/CalendarPage";
import HabitsPage from "./pages/HabitsPage";
import ProductivityDashboardPage from "./pages/ProductivityDashboardPage";
import ReportsPage from "./pages/ReportsPage";
import TasksPage from "./pages/TasksPage";

const ProductivityProfilePage = lazy(() => import("./pages/ProductivityProfilePage"));

interface ProductivityIndexProps {
  initialPage?: string;
}

/**
 * Shell for the Productivity workspace. Mirrors the Fitness `Index` shell but is
 * driven entirely by the workspace registry, so new nav items/pages slot in
 * without touching routing glue. Navigation is client-side (no reload).
 */
const ProductivityIndex = ({ initialPage = "home" }: ProductivityIndexProps) => {
  const [activePage, setActivePage] = useState(initialPage);
  const { profile, user } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const { workspace } = useWorkspace();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setActivePage(resolveActivePage(workspace.id, location.pathname));
  }, [location.pathname, workspace.id]);

  const handleNavigate = (page: string) => {
    setActivePage(page);
    const target = workspace.navItems.find((item) => item.id === page);
    navigate(target?.route ?? workspace.homeRoute);
  };

  const renderPage = () => {
    switch (activePage) {
      case "habits":
        return <HabitsPage />;
      case "tasks":
        return <TasksPage />;
      case "calendar":
        return <CalendarPage />;
      case "reports":
        return <ReportsPage />;
      case "profile":
        return <ProductivityProfilePage />;
      case "home":
      default:
        return <ProductivityDashboardPage onNavigate={handleNavigate} />;
    }
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const activeItem = workspace.navItems.find((item) => item.id === activePage);
  const pageTitle = activePage === "home" ? `Hello, ${firstName}` : activeItem?.label ?? "";

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav active={activePage} onNavigate={handleNavigate} />
      <main className="pb-[calc(7rem_+_env(safe-area-inset-bottom))] md:ml-72 md:pb-10">
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <WorkspaceSwitcher variant="compact" className="md:hidden" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                  {activePage === "home" ? workspace.tagline : workspace.label}
                </p>
                <h2 className="text-base font-extrabold capitalize text-foreground md:text-lg">
                  {pageTitle}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Toggle theme"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <ProductivitySearch onNavigate={handleNavigate} />
              <ProductivityNotificationCenter
                userId={user?.id}
                timezone={timezone}
                onNavigate={handleNavigate}
              />
              <button
                aria-label="Open profile"
                onClick={() => navigate(workspace.profileRoute)}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ProfileAvatar
                  avatarPath={profile?.avatar_url}
                  fullName={profile?.full_name ?? "FitTrack Member"}
                  className="h-10 w-10 border-2 border-primary/50"
                />
              </button>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          <Suspense fallback={<PageSkeleton label="Loading" variant="profile" />}>
            {renderPage()}
          </Suspense>
        </div>
      </main>
      <BottomNav active={activePage} onNavigate={handleNavigate} />
    </div>
  );
};

export default ProductivityIndex;
