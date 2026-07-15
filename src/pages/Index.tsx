import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import SidebarNav from "@/components/Sidebar";
import PageSkeleton from "@/components/ui/page-skeleton";
import WorkspaceSwitcher from "@/components/workspace/WorkspaceSwitcher";
import HelpButton from "@/features/help/components/HelpButton";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { BRAND } from "@/lib/brand";
import DashboardPage from "./DashboardPage";
import NotificationsPage from "./NotificationsPage";
import PlanPage from "./PlanPage";
import PRsPage from "./PRsPage";
import ProgressPage from "./ProgressPage";
import WorkoutPage from "./WorkoutPage";

// Profile pages are lazy-loaded — the profile route is a leaf destination the
// shell rarely opens, so its bundle stays out of the initial workspace payload.
const FitnessProfilePage = lazy(() => import("./FitnessProfilePage"));

interface IndexProps {
  initialPage?: string;
}

const routeToPage = (pathname: string) => {
  switch (pathname) {
    case "/workout":
      return "workout";
    case "/plan":
      return "plan";
    case "/fitness/profile":
    case "/profile":
      return "profile";
    case "/progress":
      return "progress";
    case "/prs":
      return "prs";
    case "/notifications":
      return "notifications";
    case "/dashboard":
    case "/":
    default:
      return "home";
  }
};

const pageToRoute = (page: string) => {
  switch (page) {
    case "workout":
      return "/workout";
    case "plan":
      return "/plan";
    case "profile":
      return "/fitness/profile";
    case "progress":
      return "/progress";
    case "prs":
      return "/prs";
    case "notifications":
      return "/notifications";
    case "home":
    default:
      return "/dashboard";
  }
};

const Index = ({ initialPage = "home" }: IndexProps) => {
  const [activePage, setActivePage] = useState(initialPage);
  const { profile, user } = useAuth();
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setActivePage(routeToPage(location.pathname));
  }, [location.pathname]);

  const handleNavigate = (page: string) => {
    setActivePage(page);
    navigate(pageToRoute(page));
  };

  const renderPage = () => {
    switch (activePage) {
      case "workout": return <WorkoutPage />;
      case "plan": return <PlanPage />;
      case "prs": return <PRsPage />;
      case "progress": return <ProgressPage />;
      case "profile": return <FitnessProfilePage />;
      case "notifications": return <NotificationsPage onNavigate={handleNavigate} />;
      case "home":
      default: return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  const pageTitle = activePage === "home"
    ? `Hello, ${profile?.full_name?.split(" ")[0] ?? "Athlete"}`
    : activePage === "prs" ? "Personal Records"
    : activePage === "notifications" ? "Notifications"
    : activePage;

  return (
    <div className="min-h-screen bg-background" data-workspace={workspace.id}>
      <SidebarNav active={activePage} onNavigate={handleNavigate} />
      <main className="pb-[calc(7rem_+_env(safe-area-inset-bottom))] md:ml-72 md:pb-10">
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <WorkspaceSwitcher variant="compact" className="md:hidden" />
              <span className="hidden h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm md:flex">
                <img src={workspace.logo} alt="" aria-hidden className="h-full w-full object-contain" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                  {activePage === "home" ? workspace.tagline : BRAND.name}
                </p>
                <h2 className="text-base font-extrabold capitalize text-foreground md:text-lg">{pageTitle}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HelpButton pageKey={`fitness.${activePage === "home" ? "dashboard" : activePage}`} />
              <NotificationCenter userId={user?.id} onNavigate={handleNavigate} />
              <button aria-label="Open profile" onClick={() => handleNavigate("profile")} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <ProfileAvatar avatarPath={profile?.avatar_url} fullName={profile?.full_name ?? `${BRAND.name} Member`} className="h-10 w-10 border-2 border-primary/50" />
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

export default Index;
