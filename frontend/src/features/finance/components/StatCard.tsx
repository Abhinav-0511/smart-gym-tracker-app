import type { LucideIcon } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  /** Tailwind text colour class for the value, e.g. "text-emerald-500". */
  tone?: string;
  className?: string;
}

/** Compact KPI tile used across the dashboard and reports. */
const StatCard = ({ label, value, icon: Icon, hint, tone, className }: StatCardProps) => (
  <GlassCard className={cn("p-4", className)}>
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={16} />
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
    </div>
    <p
      className={cn(
        "mt-1 text-xl font-extrabold leading-tight text-foreground tabular-nums break-words [overflow-wrap:anywhere] sm:text-2xl",
        tone,
      )}
    >
      {value}
    </p>
    {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
  </GlassCard>
);

export default StatCard;
