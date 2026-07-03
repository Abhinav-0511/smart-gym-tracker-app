import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/hooks/useAuth";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicOnlyRoute;
