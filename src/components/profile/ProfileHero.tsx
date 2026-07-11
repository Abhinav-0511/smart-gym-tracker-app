import { useState } from "react";
import { Camera } from "lucide-react";

import AvatarUploadDialog from "@/components/profile/AvatarUploadDialog";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface HeroStat {
  label: string;
  value: string;
}

interface ProfileHeroProps {
  /** Small module-branded label above the name, e.g. "Fitness Profile". */
  eyebrow: string;
  /** Tailwind classes for the branded gradient backdrop of the hero card. */
  accentClassName?: string;
  /** Optional quick-stat chips rendered under the identity block. */
  stats?: HeroStat[];
}

function formatMemberSince(createdAt: string | undefined): string | null {
  if (!createdAt) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(createdAt));
}

/**
 * Shared, module-branded profile header. Shows the one shared account identity
 * (avatar, name, email) with a clickable avatar that opens the avatar uploader.
 * Each module tints it with its own `accentClassName` so the same account reads
 * differently per module — like Spotify vs LinkedIn on one login.
 */
const ProfileHero = ({ eyebrow, accentClassName, stats }: ProfileHeroProps) => {
  const { user, profile, updateProfile } = useAuth();
  const [avatarOpen, setAvatarOpen] = useState(false);

  const fullName = profile?.full_name ?? "FitTrack Member";
  const memberSince = formatMemberSince(user?.created_at);

  return (
    <div
      className={cn(
        "glass-card overflow-hidden p-0 animate-fade-in",
      )}
    >
      <div className={cn("bg-gradient-to-br px-5 pb-5 pt-6 sm:px-6", accentClassName ?? "from-primary/15 to-transparent")}>
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">{eyebrow}</p>
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Change profile avatar"
            onClick={() => setAvatarOpen(true)}
          >
            <ProfileAvatar
              avatarPath={profile?.avatar_url}
              fullName={fullName}
              className="h-16 w-16 border-2 border-primary/40 sm:h-20 sm:w-20"
              fallbackClassName="bg-accent text-2xl text-accent-foreground"
            />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/65 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera size={18} aria-hidden="true" />
            </span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              {fullName}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email ?? "Email unavailable"}
            </p>
            {memberSince && (
              <p className="mt-0.5 text-xs text-muted-foreground">Member since {memberSince}</p>
            )}
          </div>
        </div>

        {stats && stats.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/60 bg-background/50 px-3 py-1.5 backdrop-blur-sm"
              >
                <span className="text-sm font-bold text-foreground">{stat.value}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {user && (
        <AvatarUploadDialog
          open={avatarOpen}
          userId={user.id}
          fullName={fullName}
          currentAvatarPath={profile?.avatar_url ?? null}
          onOpenChange={setAvatarOpen}
          onSaveReference={async (path) => {
            await updateProfile({ avatar_url: path });
          }}
        />
      )}
    </div>
  );
};

export default ProfileHero;
