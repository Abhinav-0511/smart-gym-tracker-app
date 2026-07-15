import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AchievementSync from "@/components/achievements/AchievementSync";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";
import ProfileThemeSync from "@/components/profile/ProfileThemeSync";
import PersonalRecordSync from "@/components/prs/PersonalRecordSync";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import AuthPage from "./pages/AuthPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";

// Each workspace shell is a large, self-contained subtree. Splitting them at the
// route boundary keeps the initial (Fitness) payload small so the app boots fast
// on mobile; the Productivity and Finance bundles load only when first visited.
const Index = lazy(() => import("./pages/Index.tsx"));
const ProductivityIndex = lazy(
  () => import("@/features/productivity/ProductivityIndex"),
);
const FinanceIndex = lazy(() => import("@/features/finance/FinanceIndex"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div
    className="flex min-h-screen items-center justify-center bg-background"
    role="status"
    aria-label="Loading"
  >
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    <span className="sr-only">Loading</span>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <WorkspaceProvider>
            <ProfileThemeSync />
            <PersonalRecordSync />
            <AchievementSync />
            <Suspense fallback={<RouteFallback />}>
            <Routes>
            <Route
              path="/"
              element={
                <PublicOnlyRoute>
                  <AuthPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/auth"
              element={
                <PublicOnlyRoute>
                  <AuthPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Index initialPage="home" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workout"
              element={
                <ProtectedRoute>
                  <Index initialPage="workout" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plan"
              element={
                <ProtectedRoute>
                  <Index initialPage="plan" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Index initialPage="profile" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fitness/profile"
              element={
                <ProtectedRoute>
                  <Index initialPage="profile" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <Index initialPage="progress" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prs"
              element={
                <ProtectedRoute>
                  <Index initialPage="prs" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Index initialPage="notifications" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/productivity"
              element={
                <ProtectedRoute>
                  <ProductivityIndex initialPage="home" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/productivity/habits"
              element={
                <ProtectedRoute>
                  <ProductivityIndex initialPage="habits" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/productivity/tasks"
              element={
                <ProtectedRoute>
                  <ProductivityIndex initialPage="tasks" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/productivity/calendar"
              element={
                <ProtectedRoute>
                  <ProductivityIndex initialPage="calendar" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/productivity/reports"
              element={
                <ProtectedRoute>
                  <ProductivityIndex initialPage="reports" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/productivity/profile"
              element={
                <ProtectedRoute>
                  <ProductivityIndex initialPage="profile" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute>
                  <FinanceIndex initialPage="home" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/transactions"
              element={
                <ProtectedRoute>
                  <FinanceIndex initialPage="transactions" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/budgets"
              element={
                <ProtectedRoute>
                  <FinanceIndex initialPage="budgets" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/goals"
              element={
                <ProtectedRoute>
                  <FinanceIndex initialPage="goals" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/reports"
              element={
                <ProtectedRoute>
                  <FinanceIndex initialPage="reports" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/profile"
              element={
                <ProtectedRoute>
                  <FinanceIndex initialPage="profile" />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </WorkspaceProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
