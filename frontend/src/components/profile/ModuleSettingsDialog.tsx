import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useWorkspace } from "@/hooks/useWorkspace";

interface ModuleSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModuleSettingsDialog = ({ open, onOpenChange }: ModuleSettingsDialogProps) => {
  const {
    allWorkspaces,
    modulePreferences,
    setModuleEnabled,
    moveWorkspace,
  } = useWorkspace();

  const enabledCount = modulePreferences.filter((preference) => preference.enabled).length;
  const workspacesById = new Map(allWorkspaces.map((workspace) => [workspace.id, workspace]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Module Settings</DialogTitle>
          <DialogDescription>
            Choose which modules appear in LifeTrack and set their order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {modulePreferences.map((preference, index) => {
            const workspace = workspacesById.get(preference.id);
            if (!workspace) return null;

            const isLastEnabled = preference.enabled && enabledCount <= 1;

            return (
              <div
                key={preference.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <GripVertical size={16} className="shrink-0 text-muted-foreground" />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
                  <img src={workspace.logo} alt="" aria-hidden className="h-full w-full object-contain" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{workspace.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {preference.enabled ? `Position ${index + 1}` : "Hidden"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${workspace.label} up`}
                    title={`Move ${workspace.label} up`}
                    className="h-8 w-8 rounded-lg"
                    disabled={index === 0}
                    onClick={() => moveWorkspace(workspace.id, "up")}
                  >
                    <ArrowUp size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${workspace.label} down`}
                    title={`Move ${workspace.label} down`}
                    className="h-8 w-8 rounded-lg"
                    disabled={index === modulePreferences.length - 1}
                    onClick={() => moveWorkspace(workspace.id, "down")}
                  >
                    <ArrowDown size={16} />
                  </Button>
                </div>

                <Switch
                  checked={preference.enabled}
                  disabled={isLastEnabled}
                  aria-label={`${preference.enabled ? "Hide" : "Show"} ${workspace.label}`}
                  onCheckedChange={(checked) => setModuleEnabled(workspace.id, checked)}
                />
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleSettingsDialog;
