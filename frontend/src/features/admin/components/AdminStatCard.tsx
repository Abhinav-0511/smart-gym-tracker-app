import type { LucideIcon } from "lucide-react";

import GlassCard from "@/components/GlassCard";

interface AdminStatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
}

/** A single dashboard metric tile. Reused across the admin dashboard header. */
const AdminStatCard = ({ label, value, icon: Icon, hint }: AdminStatCardProps) => (
  <GlassCard>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon size={18} />
      </span>
    </div>
  </GlassCard>
);

export default AdminStatCard;
