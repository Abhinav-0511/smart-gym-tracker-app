import ProfileAvatar from "@/components/profile/ProfileAvatar";
import WorkspaceSwitcher from "@/components/workspace/WorkspaceSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { BRAND } from "@/lib/brand";
import { formatProfileValue } from "@/lib/profile";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  active: string;
  onNavigate: (page: string) => void;
}

const SidebarNav = ({ active, onNavigate }: SidebarNavProps) => {
  const { profile } = useAuth();
  const { workspace } = useWorkspace();
  const fullName = profile?.full_name ?? `${BRAND.name} Member`;

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-white/10 bg-[#0b2454] text-white md:flex">
    <div className="p-4">
      <WorkspaceSwitcher />
    </div>
    <nav className="flex-1 px-3 space-y-1">
      {workspace.navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.id)}
          aria-current={active === item.id ? "page" : undefined}
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
    <div className="space-y-3 p-4">
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
      <p className="text-center text-[10px] font-medium uppercase tracking-[.14em] text-white/35">
        {BRAND.poweredBy}
      </p>
    </div>
    </aside>
  );
};

export default SidebarNav;
