import { useMemo, useState } from "react";
import {
  Award,
  CalendarDays,
  Dumbbell,
  Edit3,
  Flame,
  ImageIcon,
  LoaderCircle,
  Ruler,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import AccountSection from "@/components/profile/AccountSection";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import ProfileHero from "@/components/profile/ProfileHero";
import { Button } from "@/components/ui/button";
import PageSkeleton from "@/components/ui/page-skeleton";
import SectionHeader from "@/components/ui/section-header";
import { achievementCategoryLabels } from "@/data/achievements";
import { useToast } from "@/hooks/use-toast";
import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentBodyWeight } from "@/hooks/useCurrentBodyWeight";
import { useDashboard } from "@/hooks/useDashboard";
import { formatProfileValue } from "@/lib/profile";
import type { ProfileUpdate } from "@/services/profiles";
import { getLocalDateString } from "@/types/dashboard";

const FitnessProfilePage = () => {
  const { user, profile, loading, error, refreshProfile, updateProfile } = useAuth();
  const { toast } = useToast();
  const timezone = profile?.timezone ?? "UTC";
  const [editOpen, setEditOpen] = useState(false);

  const achievementsQuery = useAchievements(user?.id);
  const { currentWeightQuery, updateWeightMutation } = useCurrentBodyWeight(user?.id);
  const { plansQuery, aggregateQuery } = useDashboard(user?.id, timezone);

  const aggregate = aggregateQuery.data;
  const activePlan = useMemo(
    () => (plansQuery.data ?? []).find((plan) => plan.isActive) ?? null,
    [plansQuery.data],
  );
  const completionPct = aggregate
    ? Math.round((aggregate.weeklyCompletedDays / 7) * 100)
    : 0;

  const handleSave = async (updates: ProfileUpdate, currentWeightKg: number | null) => {
    const weightChanged =
      currentWeightKg !== null && currentWeightKg !== currentWeightQuery.data?.weightKg;

    await Promise.all([
      updateProfile(updates),
      weightChanged
        ? updateWeightMutation.mutateAsync({
            recordedOn: getLocalDateString(new Date(), updates.timezone ?? profile?.timezone ?? "UTC"),
            weightKg: currentWeightKg,
          })
        : Promise.resolve(),
    ]);
    toast({ title: "Profile updated", description: "Your changes have been saved." });
  };

  if (loading) {
    return <PageSkeleton label="Loading profile" variant="profile" />;
  }

  if (!profile || error) {
    return (
      <GlassCard className="py-8 text-center">
        <p className="font-semibold text-foreground">Couldn’t load your profile</p>
        <p className="mt-1 text-sm text-muted-foreground">{error ?? "Please try again."}</p>
        <Button className="mt-4" onClick={() => void refreshProfile()}>
          <RefreshCw size={16} />
          Retry
        </Button>
      </GlassCard>
    );
  }

  const weightLabel = currentWeightQuery.isPending
    ? "Loading…"
    : currentWeightQuery.data
      ? `${currentWeightQuery.data.weightKg} kg`
      : "Not tracked";

  const details: { label: string; value: string; soon?: boolean }[] = [
    { label: "Goal", value: profile.fitness_goal || "Not set" },
    { label: "Experience", value: formatProfileValue(profile.experience_level) },
    { label: "Weight", value: weightLabel },
    { label: "Height", value: profile.height_cm ? `${profile.height_cm} cm` : "Not set" },
    { label: "Age", value: "Add in future", soon: true },
    { label: "Gender", value: "Add in future", soon: true },
    { label: "Preferred days", value: "Coming soon", soon: true },
    { label: "Session length", value: "Coming soon", soon: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ProfileHero
        eyebrow="Fitness Profile"
        accentClassName="from-primary/20 via-primary/5 to-transparent"
        stats={
          aggregate
            ? [
                { label: "day streak", value: String(aggregate.currentStreak) },
                { label: "workouts", value: String(aggregate.totalCompletedWorkouts) },
                { label: "PRs", value: String(aggregate.totalPRCount) },
              ]
            : undefined
        }
      />

      {/* Fitness dashboard stat grid */}
      {aggregate ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard label="Current Streak" value={`${aggregate.currentStreak} days`} icon={<Flame size={18} />} />
          <StatCard label="Longest Streak" value={`${aggregate.longestStreak} days`} icon={<TrendingUp size={18} />} />
          <StatCard label="Workouts" value={aggregate.totalCompletedWorkouts} icon={<Dumbbell size={18} />} />
          <StatCard label="Personal Records" value={aggregate.totalPRCount} icon={<Trophy size={18} />} />
          <StatCard label="This Week" value={`${aggregate.weeklyCompletedDays}/7`} icon={<Target size={18} />} />
          <StatCard label="Completion" value={`${completionPct}%`} icon={<CalendarDays size={18} />} />
        </div>
      ) : (
        <GlassCard className="py-6 text-center" role="status">
          <LoaderCircle className="mx-auto animate-spin text-primary" size={20} />
          <span className="sr-only">Loading fitness statistics</span>
        </GlassCard>
      )}

      {/* Fitness details */}
      <GlassCard>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Fitness details</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            <Edit3 size={14} />
            Edit
          </Button>
        </div>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {details.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span
                className={`text-right text-sm font-medium ${
                  item.soon ? "text-muted-foreground/70" : "text-foreground"
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Active plan */}
      <GlassCard>
        <div className="mb-1 flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Current active plan</h3>
        </div>
        {activePlan ? (
          <>
            <p className="text-base font-semibold text-foreground">{activePlan.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activePlan.days.filter((day) => !day.isRestDay).length} training days ·{" "}
              {activePlan.days.reduce((total, day) => total + day.exercises.length, 0)} exercises
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active plan yet — create one to start building your streak.
          </p>
        )}
      </GlassCard>

      {/* Achievements */}
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
            <p className="text-sm text-muted-foreground">Couldn&apos;t load achievements.</p>
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
                        className={`py-3 text-center ${achievement.unlocked ? "" : "opacity-60"}`}
                      >
                        <span
                          className="text-2xl"
                          aria-label={achievement.unlocked ? "Unlocked" : "Locked"}
                          role="img"
                        >
                          {achievement.icon}
                        </span>
                        <p className="mt-1 text-xs font-medium text-foreground">{achievement.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{achievement.description}</p>
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
                          {achievement.progress.unit ?? ""} / {achievement.progress.target}
                          {achievement.progress.unit ?? ""}
                        </p>
                      </GlassCard>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Future-ready placeholders */}
      <div className="grid gap-3 sm:grid-cols-2">
        <GlassCard className="border-dashed">
          <div className="mb-1 flex items-center gap-2">
            <Ruler size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Body measurements</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Track chest, waist, arms and more. Coming soon.
          </p>
        </GlassCard>
        <GlassCard className="border-dashed">
          <div className="mb-1 flex items-center gap-2">
            <ImageIcon size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Progress photos</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            A private timeline of your transformation. Coming soon.
          </p>
        </GlassCard>
      </div>

      <AccountSection />

      <EditProfileDialog
        open={editOpen}
        profile={profile}
        currentWeightKg={currentWeightQuery.data?.weightKg ?? null}
        weightLoading={currentWeightQuery.isPending}
        onOpenChange={setEditOpen}
        onSave={handleSave}
      />
    </div>
  );
};

export default FitnessProfilePage;
