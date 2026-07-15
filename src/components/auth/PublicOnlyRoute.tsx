import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/hooks/useAuth";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (session) {
    const redirectParam = new URLSearchParams(location.search).get("redirect");
    if (redirectParam && redirectParam.startsWith("/")) {
      return <Navigate to={redirectParam} replace />;
    }
    // Admins land in the portal; everyone else in their dashboard. This is DB
    // truth (profiles.is_admin) — the same flag AdminRoute and RLS enforce.
    const nextPath = profile?.is_admin ? "/admin" : "/dashboard";
    return <Navigate to={nextPath} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
