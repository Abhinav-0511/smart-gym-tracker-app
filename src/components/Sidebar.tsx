import { Home, Dumbbell, Calendar, Trophy, User, BarChart3 } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/hooks/useAuth";
import { formatProfileValue } from "@/lib/profile";
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

const SidebarNav = ({ active, onNavigate }: SidebarNavProps) => {
  const { profile } = useAuth();
  const fullName = profile?.full_name ?? "FitTrack Member";

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-white/10 bg-[#0b2454] text-white md:flex">
    <div className="p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
          <BrandLogo className="h-full w-full max-w-none" />
        </div>
        <div>
          <span className="block text-xl font-extrabold tracking-tight text-white">FitTrack</span>
          <span className="block text-[9px] font-semibold uppercase tracking-[.22em] text-primary">by VERNEX</span>
        </div>
      </div>
    </div>
    <nav className="flex-1 px-3 space-y-1">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200",
            active === item.id
              ? "bg-primary text-primary-foreground"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          )}
        >
          <item.icon size={20} />
          {item.label}
        </button>
      ))}
    </nav>
    <div className="p-4">
      <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            avatarPath={profile?.avatar_url}
            fullName={fullName}
            fallbackClassName="text-sm"
          />
          <div>
            <p className="text-sm font-medium text-white line-clamp-1">{fullName}</p>
            <p className="text-xs text-white/50">
              {formatProfileValue(profile?.experience_level ?? null)}
            </p>
          </div>
        </div>
      </div>
    </div>
    </aside>
  );
};

export default SidebarNav;
