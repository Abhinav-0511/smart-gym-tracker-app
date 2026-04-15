import { useState } from "react";
import { Flame, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";

interface AuthPageProps {
  onLogin: () => void;
}

const AuthPage = ({ onLogin }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4 glow-primary">
            <Flame size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">FitTrack</h1>
          <p className="text-muted-foreground text-sm mt-1">Your premium gym companion</p>
        </div>

        <GlassCard className="p-6">
          <div className="flex bg-secondary rounded-xl p-1 mb-6">
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => setIsLogin(true)}
            >
              Log In
            </button>
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Alex Johnson"
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                placeholder="alex@example.com"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground pr-10"
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <Button size="lg" className="w-full mt-6" onClick={onLogin}>
            {isLogin ? "Log In" : "Create Account"}
          </Button>
        </GlassCard>
      </div>
    </div>
  );
};

export default AuthPage;
