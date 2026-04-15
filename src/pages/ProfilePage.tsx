import { Settings, Moon, Sun, ChevronRight, LogOut, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { userProfile, achievements } from "@/data/mockData";
import { useState } from "react";

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground mb-3">
          {userProfile.avatar}
        </div>
        <h1 className="text-xl font-bold text-foreground">{userProfile.name}</h1>
        <p className="text-sm text-muted-foreground">{userProfile.email}</p>
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{userProfile.totalWorkouts}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Workouts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{userProfile.streak}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{userProfile.totalPRs}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">PRs</p>
          </div>
        </div>
      </div>

      {/* Fitness Info */}
      <GlassCard>
        <h3 className="font-semibold text-foreground text-sm mb-3">Fitness Profile</h3>
        <div className="space-y-3">
          {[
            { label: "Goal", value: userProfile.goal },
            { label: "Experience", value: userProfile.experience },
            { label: "Weight", value: `${userProfile.weight} kg` },
            { label: "Height", value: `${userProfile.height} cm` },
            { label: "Member Since", value: userProfile.memberSince },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Achievements</h3>
          <Award size={18} className="text-primary" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((a) => (
            <GlassCard key={a.id} className={`text-center py-3 ${!a.unlocked ? "opacity-40" : ""}`}>
              <span className="text-2xl">{a.icon}</span>
              <p className="text-[10px] font-medium text-foreground mt-1">{a.title}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Settings */}
      <GlassCard>
        <h3 className="font-semibold text-foreground text-sm mb-3">Settings</h3>
        <div className="space-y-1">
          <button
            className="flex items-center justify-between w-full py-2.5 text-sm"
            onClick={() => setDarkMode(!darkMode)}
          >
            <span className="flex items-center gap-3 text-foreground">
              {darkMode ? <Moon size={16} /> : <Sun size={16} />}
              Dark Mode
            </span>
            <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${darkMode ? "bg-primary" : "bg-secondary"}`}>
              <div className={`w-4 h-4 rounded-full bg-foreground transition-transform ${darkMode ? "translate-x-5" : ""}`} />
            </div>
          </button>
          <button className="flex items-center justify-between w-full py-2.5 text-sm text-foreground">
            <span className="flex items-center gap-3"><Settings size={16} /> Preferences</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
      </GlassCard>

      <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
        <LogOut size={16} />
        Sign Out
      </Button>
    </div>
  );
};

export default ProfilePage;
