import GlassCard from "./GlassCard";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const StatCard = ({ label, value, icon, trend, trendUp }: StatCardProps) => (
  <GlassCard className="animate-slide-up">
    <div className="flex items-center justify-between mb-2">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</span>
      <div className="text-primary">{icon}</div>
    </div>
    <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
    {trend && (
      <span className={cn("text-xs font-medium mt-1 inline-block", trendUp ? "text-primary" : "text-destructive")}>
        {trend}
      </span>
    )}
  </GlassCard>
);

export default StatCard;
