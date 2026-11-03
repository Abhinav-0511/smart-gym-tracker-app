import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  WorkspaceContext,
  type WorkspaceContextValue,
} from "@/contexts/workspace-context";
import type { WorkspaceId } from "@/features/workspace/types";
import {
  DEFAULT_MODULE_PREFERENCES,
  getWorkspace,
  getOrderedWorkspaces,
  normalizeModulePreferences,
  resolveWorkspaceFromPath,
  WORKSPACES,
} from "@/features/workspace/workspace-registry";

const STORAGE_KEY = "fittrack.active-workspace";
const MODULE_STORAGE_KEY = "fittrack.module-preferences";

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
  const [modulePreferences, setModulePreferences] = useState(() => {
    if (typeof window === "undefined") return [...DEFAULT_MODULE_PREFERENCES];

    try {
      const stored = window.localStorage.getItem(MODULE_STORAGE_KEY);
      return normalizeModulePreferences(stored ? JSON.parse(stored) : null);
    } catch {
      return [...DEFAULT_MODULE_PREFERENCES];
    }
  });

  const activeWorkspaceId = resolveWorkspaceFromPath(location.pathname);
  const enabledWorkspaces = useMemo(
    () => getOrderedWorkspaces(modulePreferences, { enabledOnly: true }),
    [modulePreferences],
  );

  const persistModulePreferences = useCallback(
    (preferences: readonly typeof modulePreferences[number][]) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(MODULE_STORAGE_KEY, JSON.stringify(preferences));
    },
    [],
  );

  // Persist whenever the route resolves to a different workspace so the choice
  // survives full page reloads and deep links.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, activeWorkspaceId);
  }, [activeWorkspaceId]);

  useEffect(() => {
    const activePreference = modulePreferences.find(
      (preference) => preference.id === activeWorkspaceId,
    );
    if (activePreference?.enabled !== false) return;

    const fallback = enabledWorkspaces[0] ?? getWorkspace(DEFAULT_MODULE_PREFERENCES[0].id);
    navigate(fallback.homeRoute, { replace: true });
  }, [activeWorkspaceId, enabledWorkspaces, modulePreferences, navigate]);

  const setWorkspace = useCallback(
    (id: WorkspaceId) => {
      if (id === activeWorkspaceId) return;
      if (!modulePreferences.some((preference) => preference.id === id && preference.enabled)) {
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, id);
      }
      navigate(getWorkspace(id).homeRoute);
    },
    [activeWorkspaceId, modulePreferences, navigate],
  );

  const setModuleEnabled = useCallback(
    (id: WorkspaceId, enabled: boolean) => {
      setModulePreferences((current) => {
        const enabledCount = current.filter((preference) => preference.enabled).length;
        if (!enabled && enabledCount <= 1) return current;

        const next = current.map((preference) =>
          preference.id === id ? { ...preference, enabled } : preference,
        );
        persistModulePreferences(next);
        return next;
      });
    },
    [persistModulePreferences],
  );

  const moveWorkspace = useCallback(
    (id: WorkspaceId, direction: "up" | "down") => {
      setModulePreferences((current) => {
        const index = current.findIndex((preference) => preference.id === id);
        const nextIndex = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;

        const next = [...current];
        [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
        persistModulePreferences(next);
        return next;
      });
    },
    [persistModulePreferences],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      activeWorkspaceId,
      workspace: getWorkspace(activeWorkspaceId),
      workspaces: enabledWorkspaces,
      allWorkspaces: WORKSPACES,
      modulePreferences,
      setWorkspace,
      setModuleEnabled,
      moveWorkspace,
    }),
    [
      activeWorkspaceId,
      enabledWorkspaces,
      modulePreferences,
      moveWorkspace,
      setModuleEnabled,
      setWorkspace,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
