import type { ComponentProps } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { getProfileInitials } from "@/lib/profile";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps extends ComponentProps<typeof Avatar> {
  avatarPath: string | null | undefined;
  fullName: string;
  fallbackClassName?: string;
}

const ProfileAvatar = ({
  avatarPath,
  fullName,
  fallbackClassName,
  className,
  ...props
}: ProfileAvatarProps) => {
  const avatarQuery = useAvatarUrl(avatarPath);

  return (
    <Avatar className={className} {...props}>
      <AvatarImage src={avatarQuery.url ?? undefined} alt={fullName} />
      <AvatarFallback
        className={cn(
          "bg-primary/20 font-bold text-primary",
          fallbackClassName,
        )}
      >
        {getProfileInitials(fullName)}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar;
