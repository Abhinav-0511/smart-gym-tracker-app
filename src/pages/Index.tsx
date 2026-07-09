import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import BottomNav from "@/components/BottomNav";
import BrandLogo from "@/components/BrandLogo";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import SidebarNav from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import DashboardPage from "./DashboardPage";
import WorkoutPage from "./WorkoutPage";
import PlanPage from "./PlanPage";
import PRsPage from "./PRsPage";
import ProgressPage from "./ProgressPage";
import ProfilePage from "./ProfilePage";

const Index = () => {
  const [activePage, setActivePage] = useState("home");
  const { profile, user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const renderPage = () => {
    switch (activePage) {
      case "home": return <DashboardPage onNavigate={setActivePage} />;
      case "workout": return <WorkoutPage />;
      case "plan": return <PlanPage />;
      case "prs": return <PRsPage />;
      case "progress": return <ProgressPage />;
      case "profile": return <ProfilePage />;
      default: return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  const pageTitle = activePage === "home"
    ? `Hello, ${profile?.full_name?.split(" ")[0] ?? "Athlete"}`
    : activePage === "prs" ? "Personal Records" : activePage;

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav active={activePage} onNavigate={setActivePage} />
      <main className="pb-28 md:ml-72 md:pb-10">
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white md:hidden">
                <BrandLogo className="h-full w-full max-w-none" />
              </div>
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
              <NotificationCenter userId={user?.id} onNavigate={setActivePage} />
              <button aria-label="Open profile" onClick={() => setActivePage("profile")} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <ProfileAvatar avatarPath={profile?.avatar_url} fullName={profile?.full_name ?? "FitTrack Member"} className="h-10 w-10 border-2 border-primary/50" />
              </button>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl p-4 md:p-8">{renderPage()}</div>
      </main>
      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
};

export default Index;
