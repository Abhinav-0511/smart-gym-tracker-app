import {
  ArrowLeftRight,
  BarChart3,
  Calendar,
  CalendarCheck,
  CheckSquare,
  Dumbbell,
  Home,
  LayoutDashboard,
  LineChart,
  ListTodo,
  PiggyBank,
  Target,
  Trophy,
  User,
  Wallet,
} from "lucide-react";

import { BRAND_LOGOS } from "@/lib/brand";
import type {
  WorkspaceDefinition,
  WorkspaceId,
  WorkspaceModulePreference,
} from "@/features/workspace/types";

/**
 * Declarative registry of every workspace. The shell, switcher, sidebar, and
 * bottom navigation are all data-driven from this list, so a future workspace
 * (Finance, Journal, Notes, …) can be added by appending one entry.
 */
export const WORKSPACES: readonly WorkspaceDefinition[] = [
  {
    id: "fitness",
    label: "Fitness",
    emoji: "🏋",
    logo: BRAND_LOGOS.fitness,
    tagline: "Train with intention, every session",
    homeRoute: "/dashboard",
    routePrefix: "/dashboard",
    profileRoute: "/fitness/profile",
    navItems: [
      { id: "home", label: "Dashboard", icon: Home, route: "/dashboard", showInBottomNav: true },
      { id: "workout", label: "Workout", icon: Dumbbell, route: "/workout", showInBottomNav: true },
      { id: "plan", label: "Plan", icon: Calendar, route: "/plan", showInBottomNav: true },
      { id: "prs", label: "Personal Records", shortLabel: "PR", icon: Trophy, route: "/prs", showInBottomNav: true },
      { id: "progress", label: "Progress", icon: BarChart3, route: "/progress", showInBottomNav: true },
      // Profile is reached via the top-bar avatar (mobile) and the sidebar
      // (desktop) — it is intentionally kept out of the mobile bottom nav.
      { id: "profile", label: "Profile", icon: User, route: "/fitness/profile" },
    ],
  },
  {
    id: "productivity",
    label: "Productivity",
    emoji: "🧠",
    logo: BRAND_LOGOS.productivity,
    tagline: "Turn intentions into done, daily",
    homeRoute: "/productivity",
    routePrefix: "/productivity",
    profileRoute: "/productivity/profile",
    navItems: [
      { id: "home", label: "Dashboard", icon: LayoutDashboard, route: "/productivity", showInBottomNav: true },
      { id: "habits", label: "Habits", icon: CheckSquare, route: "/productivity/habits", showInBottomNav: true },
      { id: "tasks", label: "Tasks", icon: ListTodo, route: "/productivity/tasks", showInBottomNav: true },
      { id: "calendar", label: "Calendar", icon: CalendarCheck, route: "/productivity/calendar", showInBottomNav: true },
      { id: "reports", label: "Reports", icon: LineChart, route: "/productivity/reports", showInBottomNav: true },
      // Reached via the top-bar avatar (mobile) and the sidebar (desktop).
      { id: "profile", label: "Profile", icon: User, route: "/productivity/profile" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    emoji: "💰",
    logo: BRAND_LOGOS.finance,
    tagline: "Grow your money with clarity",
    homeRoute: "/finance",
    routePrefix: "/finance",
    profileRoute: "/finance/profile",
    navItems: [
      { id: "home", label: "Dashboard", icon: LayoutDashboard, route: "/finance", showInBottomNav: true },
      { id: "transactions", label: "Transactions", icon: ArrowLeftRight, route: "/finance/transactions", showInBottomNav: true },
      { id: "budgets", label: "Budgets", icon: Wallet, route: "/finance/budgets", showInBottomNav: true },
      { id: "goals", label: "Savings", icon: Target, route: "/finance/goals", showInBottomNav: true },
      { id: "reports", label: "Reports", icon: PiggyBank, route: "/finance/reports", showInBottomNav: true },
      // Reached via the top-bar avatar (mobile) and the sidebar (desktop).
      { id: "profile", label: "Profile", icon: User, route: "/finance/profile" },
    ],
  },
] as const;

/** The workspace shown to first-time users before any preference is stored. */
export const DEFAULT_WORKSPACE_ID: WorkspaceId = "fitness";

export const DEFAULT_MODULE_PREFERENCES: readonly WorkspaceModulePreference[] =
  WORKSPACES.map((workspace) => ({
    id: workspace.id,
    enabled: true,
  }));

const workspacesById = new Map<WorkspaceId, WorkspaceDefinition>(
  WORKSPACES.map((workspace) => [workspace.id, workspace]),
);

export function getWorkspace(id: WorkspaceId): WorkspaceDefinition {
  const workspace = workspacesById.get(id);
  if (!workspace) {
    throw new Error(`Unknown workspace: ${id}`);
  }
  return workspace;
}

export function normalizeModulePreferences(
  preferences: unknown,
): WorkspaceModulePreference[] {
  const knownIds = new Set(WORKSPACES.map((workspace) => workspace.id));
  const normalized: WorkspaceModulePreference[] = [];

  if (Array.isArray(preferences)) {
    preferences.forEach((item) => {
      if (
        typeof item === "object"
        && item !== null
        && "id" in item
        && knownIds.has(item.id as WorkspaceId)
        && !normalized.some((preference) => preference.id === item.id)
      ) {
        normalized.push({
          id: item.id as WorkspaceId,
          enabled: "enabled" in item ? Boolean(item.enabled) : true,
        });
      }
    });
  }

  WORKSPACES.forEach((workspace) => {
    if (!normalized.some((preference) => preference.id === workspace.id)) {
      normalized.push({ id: workspace.id, enabled: true });
    }
  });

  if (!normalized.some((preference) => preference.enabled)) {
    const defaultIndex = normalized.findIndex(
      (preference) => preference.id === DEFAULT_WORKSPACE_ID,
    );
    normalized[defaultIndex >= 0 ? defaultIndex : 0] = {
      ...normalized[defaultIndex >= 0 ? defaultIndex : 0],
      enabled: true,
    };
  }

  return normalized;
}

export function getOrderedWorkspaces(
  preferences: readonly WorkspaceModulePreference[],
  options: { enabledOnly?: boolean } = {},
): WorkspaceDefinition[] {
  return preferences
    .filter((preference) => !options.enabledOnly || preference.enabled)
    .map((preference) => getWorkspace(preference.id));
}

/**
 * Resolve which workspace a pathname belongs to. Productivity is matched by its
 * dedicated prefix; every other route falls back to Fitness so existing routes
 * keep their original behaviour.
 */
export function resolveWorkspaceFromPath(pathname: string): WorkspaceId {
  const match = WORKSPACES.find(
    (workspace) =>
      workspace.id !== DEFAULT_WORKSPACE_ID
      && (pathname === workspace.routePrefix
        || pathname.startsWith(`${workspace.routePrefix}/`)),
  );
  return match?.id ?? DEFAULT_WORKSPACE_ID;
}

/** Map a pathname to the active nav item id within its workspace. */
export function resolveActivePage(workspaceId: WorkspaceId, pathname: string): string {
  const workspace = getWorkspace(workspaceId);
  // Longest matching route wins so "/productivity/habits" beats "/productivity".
  const match = [...workspace.navItems]
    .sort((left, right) => right.route.length - left.route.length)
    .find((item) => pathname === item.route || pathname.startsWith(`${item.route}/`));
  return match?.id ?? workspace.navItems[0]?.id ?? "home";
}
