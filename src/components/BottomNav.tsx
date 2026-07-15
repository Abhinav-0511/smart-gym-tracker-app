import { useWorkspace } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  active: string;
  onNavigate: (page: string) => void;
}

const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  const { workspace } = useWorkspace();
  const items = workspace.navItems.filter((item) => item.showInBottomNav);

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0b2454]/95 shadow-lg backdrop-blur-md md:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-1.5 py-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={active === item.id ? "page" : undefined}
            className={cn(
              "flex min-w-[58px] flex-col items-center gap-0.5 rounded-2xl px-2 py-2 transition-all duration-300",
              active === item.id
                ? "bg-primary text-primary-foreground"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={22} strokeWidth={active === item.id ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
