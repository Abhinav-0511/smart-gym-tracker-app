import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/hooks/useAuth";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (session) {
    const redirectParam = new URLSearchParams(location.search).get("redirect");
    const nextPath = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/dashboard";
    return <Navigate to={nextPath} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
