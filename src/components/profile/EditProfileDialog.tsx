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

interface EditProfileDialogProps {
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

const EditProfileDialog = ({
  open,
  profile,
  onOpenChange,
  onSave,
}: EditProfileDialogProps) => {
  const [fullName, setFullName] = useState(profile.full_name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [fitnessGoal, setFitnessGoal] = useState(profile.fitness_goal ?? "");
  const [experienceLevel, setExperienceLevel] = useState(
    profile.experience_level ?? "not_set",
  );
  const [height, setHeight] = useState(profile.height_cm?.toString() ?? "");
  const [timezone, setTimezone] = useState(profile.timezone);
  const [theme, setTheme] = useState(profile.theme);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setFullName(profile.full_name);
    setAvatarUrl(profile.avatar_url ?? "");
    setFitnessGoal(profile.fitness_goal ?? "");
    setExperienceLevel(profile.experience_level ?? "not_set");
    setHeight(profile.height_cm?.toString() ?? "");
    setTimezone(profile.timezone);
    setTheme(profile.theme);
    setError(null);
  }, [open, profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const normalizedName = fullName.trim();
    const normalizedTimezone = timezone.trim();
    const parsedHeight = height.trim() ? Number(height) : null;

    if (!normalizedName) {
      setError("Full name is required.");
      return;
    }

    if (
      parsedHeight !== null
      && (!Number.isFinite(parsedHeight) || parsedHeight < 50 || parsedHeight > 300)
    ) {
      setError("Height must be between 50 and 300 cm.");
      return;
    }

    if (!isValidTimezone(normalizedTimezone)) {
      setError("Enter a valid IANA timezone, such as Asia/Calcutta.");
      return;
    }

    if (avatarUrl.trim()) {
      try {
        const url = new URL(avatarUrl.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error();
        }
      } catch {
        setError("Avatar must be a valid HTTP or HTTPS URL.");
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        full_name: normalizedName,
        avatar_url: avatarUrl.trim() || null,
        fitness_goal: fitnessGoal.trim() || null,
        experience_level:
          experienceLevel === "not_set" ? null : experienceLevel,
        height_cm: parsedHeight,
        timezone: normalizedTimezone,
        theme,
      });
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn’t save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your personal and fitness preferences.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={saving}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-avatar">Avatar URL</Label>
            <Input
              id="profile-avatar"
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://example.com/avatar.jpg"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-goal">Fitness goal</Label>
            <Input
              id="profile-goal"
              value={fitnessGoal}
              onChange={(event) => setFitnessGoal(event.target.value)}
              placeholder="Build muscle"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Experience level</Label>
            <Select
              value={experienceLevel}
              onValueChange={setExperienceLevel}
              disabled={saving}
            >
              <SelectTrigger aria-label="Experience level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_set">Not set</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-height">Height (cm)</Label>
            <Input
              id="profile-height"
              type="number"
              min={50}
              max={300}
              step="0.1"
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-timezone">Timezone</Label>
            <Input
              id="profile-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="Asia/Calcutta"
              disabled={saving}
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

export default EditProfileDialog;
