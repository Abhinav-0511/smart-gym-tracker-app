import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AlertCircle, LogOut, RefreshCw } from "lucide-react";

import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, profile, loading, error, refreshProfile, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  if (!profile || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <GlassCard className="w-full max-w-sm text-center">
          <AlertCircle size={28} className="text-destructive mx-auto mb-3" />
          <h1 className="text-lg font-bold text-foreground">We couldn’t load your profile</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {error ?? "Please retry before continuing."}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <Button variant="outline" onClick={() => void logout()}>
              <LogOut size={16} />
              Sign Out
            </Button>
            <Button onClick={() => void refreshProfile()}>
              <RefreshCw size={16} />
              Retry
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
