import { Home, Dumbbell, Calendar, Trophy, User, BarChart3, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  active: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: "home", label: "Dashboard", icon: Home },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "plan", label: "Plan", icon: Calendar },
  { id: "prs", label: "Personal Records", icon: Trophy },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
];

const SidebarNav = ({ active, onNavigate }: SidebarNavProps) => (
  <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 glass border-r border-[hsl(var(--glass-border))] z-40">
    <div className="p-6">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Flame size={20} className="text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">FitTrack</span>
      </div>
    </div>
    <nav className="flex-1 px-3 space-y-1">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
            active === item.id
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <item.icon size={20} />
          {item.label}
        </button>
      ))}
    </nav>
    <div className="p-4">
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            AJ
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Alex Johnson</p>
            <p className="text-xs text-muted-foreground">Intermediate</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
);

export default SidebarNav;
