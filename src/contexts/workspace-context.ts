import { createContext } from "react";

import type { WorkspaceDefinition, WorkspaceId } from "@/features/workspace/types";

export interface WorkspaceContextValue {
  /** The workspace derived from the current route. */
  activeWorkspaceId: WorkspaceId;
  /** Full definition of the active workspace (nav items, labels, etc.). */
  workspace: WorkspaceDefinition;
  /** All registered workspaces, for rendering the switcher. */
  workspaces: readonly WorkspaceDefinition[];
  /**
   * Switch workspaces. Persists the choice and navigates to the target
   * workspace's home route without reloading the application.
   */
  setWorkspace: (id: WorkspaceId) => void;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined,
);
