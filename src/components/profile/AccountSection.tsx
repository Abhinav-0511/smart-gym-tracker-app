import { useState } from "react";
import {
  ChevronRight,
  Globe,
  KeyRound,
  Clock,
  LogOut,
  Moon,
  Settings2,
  Sun,
} from "lucide-react";

import BrandAbout from "@/components/BrandAbout";
import EditAccountDialog from "@/components/profile/EditAccountDialog";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { requestPasswordReset } from "@/services/auth";
import type { ProfileUpdate } from "@/services/profiles";

interface AccountSectionProps {
  className?: string;
}

/**
 * The shared "Global Account" card rendered on every module profile. It is the
 * single home for the one authenticated account — identity, theme, language,
 * timezone, security and sign-out — so no module duplicates this data. Fully
 * self-contained: it reads and mutates the account through `useAuth`.
 */
const AccountSection = ({ className }: AccountSectionProps) => {
  const { user, profile, logout, updateProfile } = useAuth();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  if (!profile) return null;

  const isDarkTheme = profile.theme === "dark";

  const handleSaveAccount = async (updates: ProfileUpdate) => {
    await updateProfile(updates);
    toast({ title: "Account updated", description: "Your changes have been saved." });
  };

  const handleThemeToggle = async () => {
    try {
      await updateProfile({ theme: isDarkTheme ? "light" : "dark" });
    } catch (themeError) {
      toast({
        variant: "destructive",
        title: "Couldn’t update theme",
        description: themeError instanceof Error ? themeError.message : "Please try again.",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email || sendingReset) return;
    setSendingReset(true);
    try {
      await requestPasswordReset(user.email);
      toast({
        title: "Password reset sent",
        description: `Check ${user.email} for a secure link to set a new password.`,
      });
    } catch (resetError) {
      toast({
        variant: "destructive",
        title: "Couldn’t send reset link",
        description: resetError instanceof Error ? resetError.message : "Please try again.",
      });
    } finally {
      setSendingReset(false);
    }
  };

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } catch (logoutError) {
      toast({
        variant: "destructive",
        title: "Couldn’t sign out",
        description: logoutError instanceof Error ? logoutError.message : "Please try again.",
      });
      setSigningOut(false);
    }
  };

  return (
    <section className={className} aria-labelledby="account-heading">
      <div className="mb-4 glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 id="account-heading" className="text-sm font-bold text-foreground">
            Account
          </h3>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Shared across modules
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ProfileAvatar
            avatarPath={profile.avatar_url}
            fullName={profile.full_name}
            className="h-11 w-11"
            fallbackClassName="text-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{profile.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? "—"}</p>
          </div>
        </div>

        <div className="space-y-0.5">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/60"
            onClick={() => setEditOpen(true)}
          >
            <span className="flex items-center gap-3">
              <Settings2 size={16} className="text-muted-foreground" /> Edit account
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/60"
            onClick={() => void handleThemeToggle()}
          >
            <span className="flex items-center gap-3">
              {isDarkTheme ? (
                <Moon size={16} className="text-muted-foreground" />
              ) : (
                <Sun size={16} className="text-muted-foreground" />
              )}
              Dark mode
            </span>
            <span
              className={`flex h-5 w-10 items-center rounded-full px-0.5 transition-colors ${
                isDarkTheme ? "bg-primary" : "bg-secondary"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-background transition-transform ${
                  isDarkTheme ? "translate-x-5" : ""
                }`}
              />
            </span>
          </button>

          <div className="flex w-full items-center justify-between px-2 py-2.5 text-sm">
            <span className="flex items-center gap-3 text-foreground">
              <Globe size={16} className="text-muted-foreground" /> Language
            </span>
            <span className="text-sm font-medium text-muted-foreground">English</span>
          </div>

          <div className="flex w-full items-center justify-between px-2 py-2.5 text-sm">
            <span className="flex items-center gap-3 text-foreground">
              <Clock size={16} className="text-muted-foreground" /> Timezone
            </span>
            <span className="max-w-[55%] truncate text-right text-sm font-medium text-foreground">
              {profile.timezone}
            </span>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/60 disabled:opacity-60"
            onClick={() => void handleChangePassword()}
            disabled={sendingReset || !user?.email}
          >
            <span className="flex items-center gap-3">
              <KeyRound size={16} className="text-muted-foreground" /> Security &amp; password
            </span>
            <span className="text-xs text-muted-foreground">
              {sendingReset ? "Sending…" : "Change"}
            </span>
          </button>
        </div>

        <Button
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          disabled={signingOut}
          onClick={() => void handleLogout()}
        >
          <LogOut size={16} />
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>

      <BrandAbout />

      <EditAccountDialog
        open={editOpen}
        profile={profile}
        onOpenChange={setEditOpen}
        onSave={handleSaveAccount}
      />
    </section>
  );
};

export default AccountSection;
