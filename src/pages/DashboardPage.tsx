import { Dumbbell, Flame, TrendingUp, Target, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import GlassCard from "@/components/GlassCard";
import { weeklyPlan, userProfile } from "@/data/mockData";

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

const DashboardPage = ({ onNavigate }: DashboardPageProps) => {
  const today = weeklyPlan[2]; // Wednesday
  const completedDays = weeklyPlan.filter((d) => d.completed).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-muted-foreground text-sm">Good morning,</p>
        <h1 className="text-2xl font-bold text-foreground">{userProfile.name} 👋</h1>
      </div>

      {/* Motivational Message */}
      <GlassCard className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center gap-3">
          <Zap className="text-primary" size={24} />
          <div>
            <p className="font-semibold text-foreground text-sm">Don't break your streak!</p>
            <p className="text-xs text-muted-foreground">You're on a {userProfile.streak}-day streak. Keep it up! 🔥</p>
          </div>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Streak" value={`${userProfile.streak} days`} icon={<Flame size={18} />} trend="+3 this week" trendUp />
        <StatCard label="Workouts" value={userProfile.totalWorkouts} icon={<Dumbbell size={18} />} trend="+5 this month" trendUp />
        <StatCard label="PRs" value={userProfile.totalPRs} icon={<TrendingUp size={18} />} trend="+2 this month" trendUp />
        <StatCard label="This Week" value={`${completedDays}/7`} icon={<Target size={18} />} />
      </div>

      {/* Today's Workout */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Today's Workout</h2>
          <span className="text-xs text-primary font-medium">{today.day}</span>
        </div>
        <GlassCard hover className="group" onClick={() => onNavigate("workout")}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground text-lg">{today.type} Day</h3>
              <p className="text-sm text-muted-foreground mt-1">{today.exercises.length} exercises · ~60 min</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {today.exercises.slice(0, 3).map((ex) => (
                  <span key={ex.id} className="text-xs bg-secondary px-2 py-1 rounded-lg text-secondary-foreground">
                    {ex.name}
                  </span>
                ))}
                {today.exercises.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{today.exercises.length - 3} more</span>
                )}
              </div>
            </div>
            <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </GlassCard>
      </div>

      {/* Start Workout CTA */}
      <Button size="lg" className="w-full text-base font-bold" onClick={() => onNavigate("workout")}>
        <Dumbbell size={20} />
        Start Workout
      </Button>

      {/* Weekly Overview */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">This Week</h2>
        <div className="flex gap-2">
          {weeklyPlan.map((day) => (
            <div
              key={day.day}
              className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                day.completed
                  ? "bg-primary/15 border border-primary/30"
                  : day.type === "Rest"
                  ? "bg-secondary/50"
                  : "bg-secondary"
              }`}
            >
              <span className="text-[10px] text-muted-foreground font-medium">{day.shortDay}</span>
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  day.completed ? "bg-primary" : day.type === "Rest" ? "bg-muted-foreground/30" : "bg-muted-foreground/50"
                }`}
              />
              <span className="text-[9px] text-muted-foreground">{day.type === "Rest" ? "Rest" : day.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
