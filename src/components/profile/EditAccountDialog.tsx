import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile, ProfileUpdate } from "@/services/profiles";

interface EditAccountDialogProps {
  open: boolean;
  profile: Profile;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: ProfileUpdate) => Promise<void>;
}

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

/**
 * Edits the *global* account fields shared by every module — name, timezone,
 * and theme. Module-specific data (e.g. fitness goal) is edited on its own
 * profile, keeping the single account clean and avoiding duplicated forms.
 */
const EditAccountDialog = ({
  open,
  profile,
  onOpenChange,
  onSave,
}: EditAccountDialogProps) => {
  const [fullName, setFullName] = useState(profile.full_name);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [theme, setTheme] = useState(profile.theme);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFullName(profile.full_name);
    setTimezone(profile.timezone);
    setTheme(profile.theme);
    setError(null);
  }, [open, profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const normalizedName = fullName.trim();
    const normalizedTimezone = timezone.trim();

    if (!normalizedName) {
      setError("Full name is required.");
      return;
    }

    if (!isValidTimezone(normalizedTimezone)) {
      setError("Enter a valid IANA timezone, such as Asia/Calcutta.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        full_name: normalizedName,
        timezone: normalizedTimezone,
        theme,
      });
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn’t save your account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            These details are shared across every module in your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Full name</Label>
            <Input
              id="account-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={saving}
              maxLength={100}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-timezone">Timezone</Label>
            <Input
              id="account-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="Asia/Calcutta"
              disabled={saving}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
            />
          </div>

          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme} disabled={saving}>
              <SelectTrigger aria-label="Theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountDialog;
