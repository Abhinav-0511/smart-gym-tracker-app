import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import SidebarNav from "@/components/Sidebar";
import DashboardPage from "./DashboardPage";
import WorkoutPage from "./WorkoutPage";
import PlanPage from "./PlanPage";
import PRsPage from "./PRsPage";
import ProgressPage from "./ProgressPage";
import ProfilePage from "./ProfilePage";
import AuthPage from "./AuthPage";

const Index = () => {
  const [activePage, setActivePage] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AuthPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <DashboardPage onNavigate={setActivePage} />;
      case "workout":
        return <WorkoutPage />;
      case "plan":
        return <PlanPage />;
      case "prs":
        return <PRsPage />;
      case "progress":
        return <ProgressPage />;
      case "profile":
        return <ProfilePage onNavigate={setActivePage} />;
      default:
        return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav active={activePage} onNavigate={setActivePage} />
      <main className="md:ml-64 pb-24 md:pb-8">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 sticky top-0 z-30 glass">
          <h2 className="font-bold text-foreground capitalize">
            {activePage === "home" ? "FitTrack" : activePage === "prs" ? "Personal Records" : activePage}
          </h2>
          <button
            onClick={() => setActivePage("progress")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            📊
          </button>
        </header>
        <div className="p-4 md:p-8 max-w-4xl">{renderPage()}</div>
      </main>
      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
};

export default Index;
