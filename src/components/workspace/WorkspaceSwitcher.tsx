import { Check, ChevronsUpDown, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import BrandLogo from "@/components/BrandLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { WorkspaceId } from "@/features/workspace/types";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  /**
   * "sidebar" — full-width brand block for the navy desktop sidebar.
   * "compact" — logo-sized trigger for the mobile header.
   */
  variant?: "sidebar" | "compact";
  className?: string;
}

/** Route the Admin module lands on. Not a workspace — see the admin entry below. */
const ADMIN_HOME_ROUTE = "/admin";

/**
 * LifeTrack brand + workspace picker. Selecting a workspace navigates to its
 * home route without reloading the app. Rendered in the desktop sidebar and, in
 * its compact form, in the mobile header so switching works on every viewport.
 *
 * The Admin Portal is offered here as a pseudo-module, but only to admins
 * (`profile.is_admin`). It is deliberately not part of the workspace registry —
 * it has its own standalone shell and route tree — so it is handled inline here
 * rather than through `setWorkspace`.
 */
const WorkspaceSwitcher = ({ variant = "sidebar", className }: WorkspaceSwitcherProps) => {
  const { workspace, workspaces, activeWorkspaceId, setWorkspace } = useWorkspace();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = Boolean(profile?.is_admin);
  // On an admin route the URL resolves to the default workspace, so we track it
  // explicitly to drive both the trigger label and the active checkmarks.
  const isAdminRoute = location.pathname.startsWith(ADMIN_HOME_ROUTE);

  const handleSelect = (id: WorkspaceId) => {
    // `setWorkspace` no-ops when the id matches the resolved workspace. Leaving
    // the admin portal it always resolves to the default workspace, so navigate
    // directly to guarantee the jump lands.
    if (isAdminRoute) {
      const target = workspaces.find((item) => item.id === id);
      if (target) navigate(target.homeRoute);
      return;
    }
    setWorkspace(id);
  };

  const handleSelectAdmin = () => {
    if (!isAdminRoute) navigate(ADMIN_HOME_ROUTE);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "compact" ? (
          <button
            type="button"
            aria-label="Switch workspace"
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              className,
            )}
          >
            <BrandLogo className="h-full w-full max-w-none" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] leading-none text-primary-foreground ring-2 ring-background">
              {isAdminRoute ? <ShieldCheck size={10} /> : workspace.emoji}
            </span>
          </button>
        ) : (
          <button
            type="button"
            aria-label="Switch workspace"
            className={cn(
              "flex w-full items-center gap-2 rounded-2xl p-1 text-left transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              className,
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
              <BrandLogo kind="app" className="h-full w-full max-w-none" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xl font-extrabold leading-none tracking-tight text-white">
                {BRAND.name}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/60">
                {isAdminRoute ? (
                  <ShieldCheck size={14} className="text-white/60" />
                ) : (
                  <img
                    src={workspace.logo}
                    alt=""
                    aria-hidden
                    className="h-3.5 w-3.5 rounded object-contain"
                  />
                )}
                {isAdminRoute ? "Admin" : workspace.label}
              </span>
            </div>
            <ChevronsUpDown size={16} className="shrink-0 text-white/40" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
          {BRAND.name} workspaces
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((item) => {
          const isActive = !isAdminRoute && item.id === activeWorkspaceId;
          return (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => handleSelect(item.id)}
              className="cursor-pointer gap-3 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
                <img src={item.logo} alt="" aria-hidden className="h-full w-full object-contain" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">{item.tagline}</p>
              </div>
              <Check
                size={16}
                className={cn("shrink-0 text-primary", isActive ? "opacity-100" : "opacity-0")}
              />
            </DropdownMenuItem>
          );
        })}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleSelectAdmin}
              className="cursor-pointer gap-3 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-sm">
                <ShieldCheck size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Admin</p>
                <p className="truncate text-xs text-muted-foreground">Manage users &amp; support</p>
              </div>
              <Check
                size={16}
                className={cn("shrink-0 text-primary", isAdminRoute ? "opacity-100" : "opacity-0")}
              />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkspaceSwitcher;
