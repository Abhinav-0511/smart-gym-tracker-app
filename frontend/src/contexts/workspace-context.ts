import { createContext } from "react";

import type {
  WorkspaceDefinition,
  WorkspaceId,
  WorkspaceModulePreference,
} from "@/features/workspace/types";

export interface WorkspaceContextValue {
  /** The workspace derived from the current route. */
  activeWorkspaceId: WorkspaceId;
  /** Full definition of the active workspace (nav items, labels, etc.). */
  workspace: WorkspaceDefinition;
  /** Enabled workspaces, in the user's chosen order. */
  workspaces: readonly WorkspaceDefinition[];
  /** Every registered workspace, including modules hidden by the user. */
  allWorkspaces: readonly WorkspaceDefinition[];
  /** User module visibility and order preferences. */
  modulePreferences: readonly WorkspaceModulePreference[];
  /**
   * Switch workspaces. Persists the choice and navigates to the target
   * workspace's home route without reloading the application.
   */
  setWorkspace: (id: WorkspaceId) => void;
  /** Show or hide a workspace in module pickers. At least one stays enabled. */
  setModuleEnabled: (id: WorkspaceId, enabled: boolean) => void;
  /** Move a module preference up or down in the module list. */
  moveWorkspace: (id: WorkspaceId, direction: "up" | "down") => void;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined,
);
