import { lazy, Suspense, useState } from "react";
import {
  BookOpen,
  Check,
  HelpCircle,
  Lightbulb,
  LogOut,
  MessageSquare,
  MoreVertical,
  Settings2,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";

import ModuleSettingsDialog from "@/components/profile/ModuleSettingsDialog";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { HelpTab } from "@/features/help/components/HelpCenter";
import { useWorkspaceMenu } from "@/features/workspace/useWorkspaceMenu";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const HelpCenter = lazy(() => import("@/features/help/components/HelpCenter"));

interface AppMenuProps {
  /** The page whose contextual help the Help entries open, e.g. "finance.budgets". */
  pageKey: string;
  /** Opens the active module's profile page. */
  onOpenProfile: () => void;
  className?: string;
}

const HELP_ENTRIES: { tab: HelpTab; label: string; icon: typeof BookOpen }[] = [
  { tab: "about", label: "Page guide", icon: BookOpen },
  { tab: "tips", label: "Tips", icon: Lightbulb },
  { tab: "faq", label: "FAQ", icon: HelpCircle },
  { tab: "support", label: "Contact support", icon: MessageSquare },
  { tab: "feedback", label: "Send feedback", icon: Star },
];

/**
 * The header overflow menu — the single place new users can reach everything the
 * shell chrome hides. Module switching, the five Help Center sections, profile
 * and sign-out are listed flat (no submenus) because the whole point is that a
 * first-time user finds them without a second guess.
 *
 * Replaces the standalone Help button in every shell; the avatar and module logo
 * stay in the header as direct shortcuts to the same destinations.
 */
const AppMenu = ({ pageKey, onOpenProfile, className }: AppMenuProps) => {
  const [helpTab, setHelpTab] = useState<HelpTab | null>(null);
  const [moduleSettingsOpen, setModuleSettingsOpen] = useState(false);
  const { profile, logout } = useAuth();
  const {
    workspaces,
    activeWorkspaceId,
    isAdmin,
    isAdminRoute,
    selectWorkspace,
    selectAdmin,
  } = useWorkspaceMenu();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not sign out",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open menu"
            title="Menu"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              className,
            )}
          >
            <MoreVertical size={18} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-[80vh] w-64 overflow-y-auto">
          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
            Modules
          </DropdownMenuLabel>
          {workspaces.map((item) => {
            const isActive = !isAdminRoute && item.id === activeWorkspaceId;
            return (
              <DropdownMenuItem
                key={item.id}
                onSelect={() => selectWorkspace(item.id)}
                className="cursor-pointer gap-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm">
                  <img src={item.logo} alt="" aria-hidden className="h-full w-full object-contain" />
                </span>
                <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                <Check
                  size={16}
                  className={cn("shrink-0 text-primary", isActive ? "opacity-100" : "opacity-0")}
                />
              </DropdownMenuItem>
            );
          })}
          {isAdmin && (
            <DropdownMenuItem onSelect={selectAdmin} className="cursor-pointer gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <ShieldCheck size={14} />
              </span>
              <span className="flex-1 truncate text-sm font-medium">Admin</span>
              <Check
                size={16}
                className={cn("shrink-0 text-primary", isAdminRoute ? "opacity-100" : "opacity-0")}
              />
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setModuleSettingsOpen(true)}
            className="cursor-pointer gap-3"
          >
            <Settings2 size={16} className="shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-sm font-medium">Module settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
            Help
          </DropdownMenuLabel>
          {HELP_ENTRIES.map(({ tab, label, icon: Icon }) => (
            <DropdownMenuItem
              key={tab}
              onSelect={() => setHelpTab(tab)}
              className="cursor-pointer gap-3"
            >
              <Icon size={16} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm font-medium">{label}</span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
            Account
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={onOpenProfile} className="cursor-pointer gap-3">
            <ProfileAvatar
              avatarPath={profile?.avatar_url}
              fullName={profile?.full_name ?? `${BRAND.name} Member`}
              className="h-6 w-6"
              fallbackClassName="text-[10px]"
            />
            <span className="flex-1 truncate text-sm font-medium">
              {profile?.full_name ?? "Profile"}
            </span>
            <User size={14} className="shrink-0 text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => void handleLogout()}
            className="cursor-pointer gap-3 text-destructive focus:text-destructive"
          >
            <LogOut size={16} className="shrink-0" />
            <span className="flex-1 truncate text-sm font-medium">Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {helpTab && (
        <Suspense fallback={null}>
          <HelpCenter
            pageKey={pageKey}
            defaultTab={helpTab}
            open
            onOpenChange={(open) => {
              if (!open) setHelpTab(null);
            }}
          />
        </Suspense>
      )}

      <ModuleSettingsDialog
        open={moduleSettingsOpen}
        onOpenChange={setModuleSettingsOpen}
      />
    </>
  );
};

export default AppMenu;
