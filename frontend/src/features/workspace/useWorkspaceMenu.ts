import { useLocation, useNavigate } from "react-router-dom";

import type { WorkspaceId } from "@/features/workspace/types";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

/** Route the Admin module lands on. Not a workspace — see `selectAdmin`. */
export const ADMIN_HOME_ROUTE = "/admin";

/**
 * Shared module-picker behaviour. Both the sidebar/header `WorkspaceSwitcher`
 * and the header overflow `AppMenu` offer the same list, so the selection rules
 * (including the admin-route special case) live here rather than being copied.
 *
 * The Admin Portal is offered as a pseudo-module, but only to admins. It is
 * deliberately not part of the workspace registry — it has its own standalone
 * shell and route tree — so it is navigated to directly instead of through
 * `setWorkspace`.
 */
export function useWorkspaceMenu() {
  const { workspace, workspaces, activeWorkspaceId, setWorkspace } = useWorkspace();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // On an admin route the URL resolves to the default workspace, so we track it
  // explicitly to drive both trigger labels and the active checkmarks.
  const isAdminRoute = location.pathname.startsWith(ADMIN_HOME_ROUTE);

  const selectWorkspace = (id: WorkspaceId) => {
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

  const selectAdmin = () => {
    if (!isAdminRoute) navigate(ADMIN_HOME_ROUTE);
  };

  return {
    workspace,
    workspaces,
    activeWorkspaceId,
    isAdmin: Boolean(profile?.is_admin),
    isAdminRoute,
    selectWorkspace,
    selectAdmin,
  };
}
