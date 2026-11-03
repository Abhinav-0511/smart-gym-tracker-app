import { Hammer } from "lucide-react";

import GlassCard from "@/components/GlassCard";

interface ComingSoonPageProps {
  title: string;
  phase: string;
}

/** Temporary placeholder for Productivity modules delivered in later phases. */
const ComingSoonPage = ({ title, phase }: ComingSoonPageProps) => (
  <GlassCard className="flex flex-col items-center gap-3 py-14 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <Hammer size={26} />
    </div>
    <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
    <p className="max-w-sm text-sm text-muted-foreground">
      This module is being built and ships in {phase}. The workspace shell,
      navigation and routing around it are already live.
    </p>
  </GlassCard>
);

export default ComingSoonPage;
