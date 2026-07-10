import { Check, ChevronsUpDown } from "lucide-react";

import BrandLogo from "@/components/BrandLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { WorkspaceId } from "@/features/workspace/types";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  /**
   * "sidebar" — full-width brand block for the navy desktop sidebar.
   * "compact" — logo-sized trigger for the mobile header.
   */
  variant?: "sidebar" | "compact";
  className?: string;
}

/**
 * FITTRACK brand + workspace picker. Selecting a workspace navigates to its home
 * route without reloading the app. Rendered in the desktop sidebar and, in its
 * compact form, in the mobile header so switching works on every viewport.
 */
const WorkspaceSwitcher = ({ variant = "sidebar", className }: WorkspaceSwitcherProps) => {
  const { workspace, workspaces, activeWorkspaceId, setWorkspace } = useWorkspace();

  const handleSelect = (id: WorkspaceId) => {
    setWorkspace(id);
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
              {workspace.emoji}
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
              <BrandLogo className="h-full w-full max-w-none" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xl font-extrabold leading-none tracking-tight text-white">
                FitTrack
              </span>
              <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-white/60">
                <span aria-hidden>{workspace.emoji}</span>
                {workspace.label}
              </span>
            </div>
            <ChevronsUpDown size={16} className="shrink-0 text-white/40" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">
          FitTrack workspaces
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((item) => {
          const isActive = item.id === activeWorkspaceId;
          return (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => handleSelect(item.id)}
              className="cursor-pointer gap-3 py-2.5"
            >
              <span className="text-lg leading-none" aria-hidden>
                {item.emoji}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkspaceSwitcher;
