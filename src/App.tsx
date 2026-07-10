import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AchievementSync from "@/components/achievements/AchievementSync";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";
import ProfileThemeSync from "@/components/profile/ProfileThemeSync";
import PersonalRecordSync from "@/components/prs/PersonalRecordSync";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import ProductivityIndex from "@/features/productivity/ProductivityIndex";
import AuthPage from "./pages/AuthPage.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="*" element={<NotFound />} />
            </Routes>
            </WorkspaceProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
