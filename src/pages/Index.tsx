import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import SidebarNav from "@/components/Sidebar";
import WorkspaceSwitcher from "@/components/workspace/WorkspaceSwitcher";
import { useAuth } from "@/hooks/useAuth";
import DashboardPage from "./DashboardPage";
import NotificationsPage from "./NotificationsPage";
import PlanPage from "./PlanPage";
import PRsPage from "./PRsPage";
import ProfilePage from "./ProfilePage";
import ProgressPage from "./ProgressPage";
import WorkoutPage from "./WorkoutPage";

interface IndexProps {
  initialPage?: string;
}

const routeToPage = (pathname: string) => {
  switch (pathname) {
    case "/workout":
      return "workout";
    case "/plan":
      return "plan";
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
      return "/profile";
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
  const { resolvedTheme, setTheme } = useTheme();
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
      case "profile": return <ProfilePage />;
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
    <div className="min-h-screen bg-background">
      <SidebarNav active={activePage} onNavigate={handleNavigate} />
      <main className="pb-[calc(7rem_+_env(safe-area-inset-bottom))] md:ml-72 md:pb-10">
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <WorkspaceSwitcher variant="compact" className="md:hidden" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">
                  {activePage === "home" ? "Your premium gym companion" : "FitTrack"}
                </p>
                <h2 className="text-base font-extrabold capitalize text-foreground md:text-lg">{pageTitle}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <NotificationCenter userId={user?.id} onNavigate={handleNavigate} />
              <button aria-label="Open profile" onClick={() => handleNavigate("profile")} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <ProfileAvatar avatarPath={profile?.avatar_url} fullName={profile?.full_name ?? "FitTrack Member"} className="h-10 w-10 border-2 border-primary/50" />
              </button>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl p-4 md:p-8">{renderPage()}</div>
      </main>
      <BottomNav active={activePage} onNavigate={handleNavigate} />
    </div>
  );
};

export default Index;
