import { useQuery } from "@tanstack/react-query";

import { createAvatarSignedUrl } from "@/services/avatar-storage";

const SIGNED_URL_REFRESH_MS = 50 * 60 * 1000;

export const avatarKeys = {
  all: ["avatar-url"] as const,
  detail: (path: string) => [...avatarKeys.all, path] as const,
};

export function useAvatarUrl(path: string | null | undefined) {
  const isLegacyExternalUrl = Boolean(path?.match(/^https?:\/\//i));
  const storagePath = path && !isLegacyExternalUrl ? path : "";
  const query = useQuery({
    queryKey: avatarKeys.detail(storagePath),
    queryFn: () => createAvatarSignedUrl(storagePath),
    enabled: Boolean(storagePath),
    staleTime: SIGNED_URL_REFRESH_MS,
    refetchInterval: SIGNED_URL_REFRESH_MS,
    refetchOnWindowFocus: true,
    // A failed sign (object missing, or RLS forbids reading another user's
    // avatar) is permanent — retrying only multiplies the console noise and
    // wasted requests. Fall back to initials on the first failure.
    retry: false,
  });

  return {
    ...query,
    url: isLegacyExternalUrl ? path : query.data,
  };
}
