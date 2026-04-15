import { Home, Dumbbell, Calendar, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  active: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "plan", label: "Plan", icon: Calendar },
  { id: "prs", label: "PRs", icon: Trophy },
  { id: "profile", label: "Profile", icon: User },
];

const BottomNav = ({ active, onNavigate }: BottomNavProps) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-[hsl(var(--glass-border))] md:hidden safe-area-bottom">
    <div className="flex items-center justify-around py-2 px-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 min-w-[60px]",
            active === item.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <item.icon size={22} strokeWidth={active === item.id ? 2.5 : 1.5} />
          <span className="text-[10px] font-medium">{item.label}</span>
          {active === item.id && (
            <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
          )}
        </button>
      ))}
    </div>
  </nav>
);

export default BottomNav;
