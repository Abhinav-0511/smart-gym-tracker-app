import type { LucideIcon } from "lucide-react";

/**
 * A workspace is a self-contained area of the app (Fitness, Productivity, and
 * future modules such as Finance or Journal). Adding a new workspace should be a
 * matter of registering it here and in the registry — not refactoring the shell.
 */
export type WorkspaceId = "fitness" | "productivity";

export interface WorkspaceNavItem {
  /** Stable page identifier used by the shell's `activePage` state. */
  id: string;
  label: string;
  icon: LucideIcon;
  /** Absolute route this nav item navigates to. */
  route: string;
  /** When true, the item is shown in the mobile bottom navigation bar. */
  showInBottomNav?: boolean;
}

export interface WorkspaceDefinition {
  id: WorkspaceId;
  /** Short label shown in the workspace switcher (e.g. "Fitness"). */
  label: string;
  /** Emoji shown alongside the label in the switcher. */
  emoji: string;
  /** One-line descriptor shown under the header title. */
  tagline: string;
  /** Route the switcher lands on when this workspace is selected. */
  homeRoute: string;
  /** URL prefix that identifies this workspace (e.g. "/productivity"). */
  routePrefix: string;
  navItems: WorkspaceNavItem[];
}
