import { useEffect } from "react";
import { useTheme } from "next-themes";

import { useAuth } from "@/hooks/useAuth";

const ProfileThemeSync = () => {
  const { profile } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (profile?.theme) {
      setTheme(profile.theme);
    }
  }, [profile?.theme, setTheme]);

  return null;
};

export default ProfileThemeSync;
