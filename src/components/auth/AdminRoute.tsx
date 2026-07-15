import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/hooks/useAuth";

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Route guard for the Admin Portal. Requires an authenticated session AND a
 * profile flagged `is_admin`. This is only the UX boundary — the real protection
 * is in the database (RLS + SECURITY DEFINER RPCs check is_admin server-side), so
 * a bypass of this guard still cannot read any admin data.
 *
 * Non-admins are sent to their normal dashboard; signed-out users to auth.
 */
const AdminRoute = ({ children }: AdminRouteProps) => {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  if (!profile?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
