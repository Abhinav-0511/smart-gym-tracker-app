import { useState } from "react";
import {
  Award,
  ChevronRight,
  Edit3,
  LoaderCircle,
  LogOut,
  Moon,
  RefreshCw,
  Settings,
  Sun,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { achievements } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatProfileValue, getProfileInitials } from "@/lib/profile";
import type { ProfileUpdate } from "@/services/profiles";

function formatMemberSince(createdAt: string | undefined): string {
  if (!createdAt) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(createdAt));
}

const ProfilePage = () => {
  const {
    user,
    profile,
    loading,
    error,
    logout,
    refreshProfile,
    updateProfile,
  } = useAuth();
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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

  const handleSave = async (updates: ProfileUpdate) => {
    await updateProfile(updates);
    toast({
      title: "Profile updated",
      description: "Your changes have been saved.",
    });
  };

  const handleThemeToggle = async () => {
    if (!profile) return;

    const nextTheme = profile.theme === "dark" ? "light" : "dark";

    try {
      await updateProfile({
        theme: nextTheme,
      });
    } catch (themeError) {
      toast({
        variant: "destructive",
        title: "Couldn’t update theme",
        description: themeError instanceof Error ? themeError.message : "Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status">
        <LoaderCircle className="animate-spin text-primary" />
        <span className="sr-only">Loading profile</span>
      </div>
    );
  }

  if (!profile || error) {
    return (
      <GlassCard className="text-center py-8">
        <p className="font-semibold text-foreground">Couldn’t load your profile</p>
        <p className="text-sm text-muted-foreground mt-1">{error ?? "Please try again."}</p>
        <Button className="mt-4" onClick={() => void refreshProfile()}>
          <RefreshCw size={16} />
          Retry
        </Button>
      </GlassCard>
    );
  }

  const isDarkTheme = profile.theme === "dark";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <Avatar className="w-20 h-20 mb-3">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl font-bold text-primary-foreground">
            {getProfileInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-bold text-foreground">{profile.full_name}</h1>
        <p className="text-sm text-muted-foreground">{user?.email ?? "Email unavailable"}</p>
        <div className="flex gap-6 mt-4">
          {["Workouts", "Streak", "PRs"].map((label) => (
            <div className="text-center" key={label}>
              <p className="text-lg font-bold text-foreground">—</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground text-sm">Fitness Profile</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            <Edit3 size={14} />
            Edit
          </Button>
        </div>
        <div className="space-y-3">
          {[
            { label: "Goal", value: profile.fitness_goal || "Not set" },
            {
              label: "Experience",
              value: formatProfileValue(profile.experience_level),
            },
            { label: "Weight", value: "Not tracked" },
            {
              label: "Height",
              value: profile.height_cm ? `${profile.height_cm} cm` : "Not set",
            },
            { label: "Timezone", value: profile.timezone },
            { label: "Theme", value: formatProfileValue(profile.theme) },
            { label: "Member Since", value: formatMemberSince(user?.created_at) },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium text-foreground text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Achievements</h3>
          <Award size={18} className="text-primary" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((achievement) => (
            <GlassCard
              key={achievement.id}
              className={`text-center py-3 ${!achievement.unlocked ? "opacity-40" : ""}`}
            >
              <span className="text-2xl">{achievement.icon}</span>
              <p className="text-[10px] font-medium text-foreground mt-1">{achievement.title}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      <GlassCard>
        <h3 className="font-semibold text-foreground text-sm mb-3">Settings</h3>
        <div className="space-y-1">
          <button
            className="flex items-center justify-between w-full py-2.5 text-sm"
            onClick={() => void handleThemeToggle()}
          >
            <span className="flex items-center gap-3 text-foreground">
              {isDarkTheme ? <Moon size={16} /> : <Sun size={16} />}
              Dark Mode
            </span>
            <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${isDarkTheme ? "bg-primary" : "bg-secondary"}`}>
              <div className={`w-4 h-4 rounded-full bg-foreground transition-transform ${isDarkTheme ? "translate-x-5" : ""}`} />
            </div>
          </button>
          <button
            className="flex items-center justify-between w-full py-2.5 text-sm text-foreground"
            onClick={() => setEditOpen(true)}
          >
            <span className="flex items-center gap-3"><Settings size={16} /> Preferences</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
      </GlassCard>

      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
        disabled={signingOut}
        onClick={() => void handleLogout()}
      >
        <LogOut size={16} />
        {signingOut ? "Signing Out…" : "Sign Out"}
      </Button>

      <EditProfileDialog
        open={editOpen}
        profile={profile}
        onOpenChange={setEditOpen}
        onSave={handleSave}
      />
    </div>
  );
};

export default ProfilePage;
