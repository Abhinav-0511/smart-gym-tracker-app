import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  WorkspaceContext,
  type WorkspaceContextValue,
} from "@/contexts/workspace-context";
import type { WorkspaceId } from "@/features/workspace/types";
import {
  getWorkspace,
  resolveWorkspaceFromPath,
  WORKSPACES,
} from "@/features/workspace/workspace-registry";

const STORAGE_KEY = "fittrack.active-workspace";

interface WorkspaceProviderProps {
  children: ReactNode;
}

/**
 * Derives the active workspace from the URL (the single source of truth) and
 * exposes a `setWorkspace` action that persists the choice and navigates —
 * client-side, so no reload and all in-memory state is preserved.
 */
export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeWorkspaceId = resolveWorkspaceFromPath(location.pathname);

  // Persist whenever the route resolves to a different workspace so the choice
  // survives full page reloads and deep links.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, activeWorkspaceId);
  }, [activeWorkspaceId]);

  const setWorkspace = useCallback(
    (id: WorkspaceId) => {
      if (id === activeWorkspaceId) return;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, id);
      }
      navigate(getWorkspace(id).homeRoute);
    },
    [activeWorkspaceId, navigate],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      activeWorkspaceId,
      workspace: getWorkspace(activeWorkspaceId),
      workspaces: WORKSPACES,
      setWorkspace,
    }),
    [activeWorkspaceId, setWorkspace],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
