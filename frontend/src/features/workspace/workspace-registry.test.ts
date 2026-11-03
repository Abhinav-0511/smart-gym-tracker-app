import { describe, expect, it } from "vitest";

import {
  getWorkspace,
  resolveActivePage,
  resolveWorkspaceFromPath,
  WORKSPACES,
} from "@/features/workspace/workspace-registry";

describe("module-aware profile routing", () => {
  it("gives every workspace a module-scoped profile route", () => {
    for (const workspace of WORKSPACES) {
      expect(workspace.profileRoute).toBeTruthy();
      const profileItem = workspace.navItems.find((item) => item.id === "profile");
      expect(profileItem).toBeDefined();
      expect(profileItem?.route).toBe(workspace.profileRoute);
    }
  });

  it("keeps Profile out of the mobile bottom navigation for every workspace", () => {
    for (const workspace of WORKSPACES) {
      const profileItem = workspace.navItems.find((item) => item.id === "profile");
      expect(profileItem?.showInBottomNav).not.toBe(true);
    }
  });

  it("resolves each profile route to its owning workspace", () => {
    expect(resolveWorkspaceFromPath("/fitness/profile")).toBe("fitness");
    expect(resolveWorkspaceFromPath("/productivity/profile")).toBe("productivity");
    expect(resolveWorkspaceFromPath("/finance/profile")).toBe("finance");
  });

  it("marks the profile page as active on its route", () => {
    for (const workspace of WORKSPACES) {
      expect(resolveActivePage(workspace.id, workspace.profileRoute)).toBe("profile");
    }
  });

  it("points each workspace's profileRoute at a real profile nav item", () => {
    for (const id of ["fitness", "productivity", "finance"] as const) {
      const workspace = getWorkspace(id);
      expect(workspace.navItems.some((item) => item.route === workspace.profileRoute)).toBe(true);
    }
  });
});
