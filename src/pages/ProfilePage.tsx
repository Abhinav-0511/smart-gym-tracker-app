import { useState } from "react";
import {
  Award,
  CalendarDays,
  Camera,
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
import BrandLogo from "@/components/BrandLogo";
import AvatarUploadDialog from "@/components/profile/AvatarUploadDialog";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/button";
import PageSkeleton from "@/components/ui/page-skeleton";
import SectionHeader from "@/components/ui/section-header";
import {
  achievementCategoryLabels,
} from "@/data/achievements";
import { useToast } from "@/hooks/use-toast";
import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentBodyWeight } from "@/hooks/useCurrentBodyWeight";
import { formatProfileValue } from "@/lib/profile";
import type { ProfileUpdate } from "@/services/profiles";
import { getLocalDateString } from "@/types/dashboard";

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
  const [avatarOpen, setAvatarOpen] = useState(false);
  const achievementsQuery = useAchievements(user?.id);
  const { currentWeightQuery, updateWeightMutation } = useCurrentBodyWeight(user?.id);

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

  const handleSave = async (
    updates: ProfileUpdate,
    currentWeightKg: number | null,
  ) => {
    const weightChanged =
      currentWeightKg !== null
      && currentWeightKg !== currentWeightQuery.data?.weightKg;

    await Promise.all([
      updateProfile(updates),
      weightChanged
        ? updateWeightMutation.mutateAsync({
            recordedOn: getLocalDateString(new Date(), updates.timezone ?? profile?.timezone ?? "UTC"),
            weightKg: currentWeightKg,
          })
        : Promise.resolve(),
    ]);
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
    return <PageSkeleton label="Loading profile" variant="profile" />;
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
        <button
          type="button"
          className="group relative mb-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Change profile avatar"
          onClick={() => setAvatarOpen(true)}
        >
          <ProfileAvatar
            avatarPath={profile.avatar_url}
            fullName={profile.full_name}
            className="h-20 w-20"
            fallbackClassName="bg-accent text-2xl text-accent-foreground"
          />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/65 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Camera size={20} aria-hidden="true" />
          </span>
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{profile.full_name}</h1>
        <p className="text-sm text-muted-foreground">{user?.email ?? "Email unavailable"}</p>
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
            {
              label: "Weight",
              value: currentWeightQuery.isPending
                ? "Loading…"
                : currentWeightQuery.data
                  ? `${currentWeightQuery.data.weightKg} kg`
                  : "Not tracked",
            },
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
        <SectionHeader
          className="mb-3"
          title="Achievements"
          action={<Award size={18} className="text-primary" />}
        />
        {achievementsQuery.isPending ? (
          <GlassCard className="py-6 text-center" role="status">
            <LoaderCircle className="mx-auto animate-spin text-primary" size={20} />
            <span className="sr-only">Loading achievements</span>
          </GlassCard>
        ) : achievementsQuery.isError || !achievementsQuery.data ? (
          <GlassCard className="py-5 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load achievements.
            </p>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => void achievementsQuery.refetch()}
            >
              <RefreshCw size={14} />
              Retry
            </Button>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {Object.entries(achievementCategoryLabels).map(([category, label]) => {
              const categoryAchievements = achievementsQuery.data.achievements.filter(
                (achievement) => achievement.category === category,
              );
              if (categoryAchievements.length === 0) return null;

              return (
                <section key={category} aria-labelledby={`achievement-${category}`}>
                  <h4
                    id={`achievement-${category}`}
                    className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {label}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categoryAchievements.map((achievement) => (
                      <GlassCard
                        key={achievement.key}
                        className={`text-center py-3 ${
                          achievement.unlocked ? "" : "opacity-60"
                        }`}
                      >
                        <span
                          className="text-2xl"
                          aria-label={achievement.unlocked ? "Unlocked" : "Locked"}
                          role="img"
                        >
                          {achievement.icon}
                        </span>
                        <p className="mt-1 text-xs font-medium text-foreground">
                          {achievement.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {achievement.description}
                        </p>
                        <div
                          className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"
                          role="progressbar"
                          aria-label={`${achievement.title} progress`}
                          aria-valuemin={0}
                          aria-valuemax={achievement.progress.target}
                          aria-valuenow={achievement.progress.current}
                        >
                          <div
                            className="h-full rounded-full bg-primary transition-[width]"
                            style={{ width: `${achievement.progress.percentage}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {achievement.progress.current}
                          {achievement.progress.unit ?? ""} /{" "}
                          {achievement.progress.target}
                          {achievement.progress.unit ?? ""}
                        </p>
                      </GlassCard>
                    ))}
                  </div>
                </section>
              );
            })}

            {achievementsQuery.data.history.length > 0 && (
              <section aria-labelledby="achievement-history">
                <h4
                  id="achievement-history"
                  className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Achievement history
                </h4>
                <GlassCard className="space-y-3">
                  {achievementsQuery.data.history.map((achievement) => (
                    <div
                      key={achievement.key}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="text-xl" aria-hidden="true">
                          {achievement.icon}
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">
                          {achievement.title}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays size={12} />
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                        }).format(new Date(achievement.unlockedAt!))}
                      </span>
                    </div>
                  ))}
                </GlassCard>
              </section>
            )}
          </div>
        )}
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

      <footer className="flex flex-col items-center gap-2 py-4 text-center">
        <BrandLogo kind="vernex" className="h-8 w-auto max-w-[150px] opacity-50" />
        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">
          FitTrack · Your Premium Gym Companion
        </p>
      </footer>

      <EditProfileDialog
        open={editOpen}
        profile={profile}
        currentWeightKg={currentWeightQuery.data?.weightKg ?? null}
        weightLoading={currentWeightQuery.isPending}
        onOpenChange={setEditOpen}
        onSave={handleSave}
      />
      <AvatarUploadDialog
        open={avatarOpen}
        userId={user!.id}
        fullName={profile.full_name}
        currentAvatarPath={profile.avatar_url}
        onOpenChange={setAvatarOpen}
        onSaveReference={async (path) => {
          await updateProfile({ avatar_url: path });
        }}
      />
    </div>
  );
};

export default ProfilePage;
