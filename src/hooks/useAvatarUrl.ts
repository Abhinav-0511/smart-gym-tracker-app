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
  });

  return {
    ...query,
    url: isLegacyExternalUrl ? path : query.data,
  };
}
