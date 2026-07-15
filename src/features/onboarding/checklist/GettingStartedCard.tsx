import { CheckCircle2, Circle, Rocket } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { useGettingStarted } from "./useGettingStarted";
import type { ChecklistModuleId } from "./checklist-config";

interface GettingStartedCardProps {
  moduleId: ChecklistModuleId;
}

/**
 * The per-module "Getting Started" checklist, shown on that module's dashboard
 * for new users only. Every item ticks itself as the user actually does it (no
 * manual buttons), and the whole card disappears — permanently — once all steps
 * are complete. Returning users never see it again.
 */
const GettingStartedCard = ({ moduleId }: GettingStartedCardProps) => {
  const { items, completeCount, total, allDone, hidden, isLoading } =
    useGettingStarted(moduleId);

  // Nothing to show: already dismissed forever, still loading, or just finished.
  if (hidden || isLoading || allDone) {
    return null;
  }

  const percent = total > 0 ? Math.round((completeCount / total) * 100) : 0;

  return (
    <GlassCard className="border-primary/25 bg-primary/[.04]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Rocket size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-foreground">Getting Started</h2>
            <p className="text-xs text-muted-foreground">
              {completeCount} of {total} complete
            </p>
          </div>
        </div>
        <span className="text-sm font-bold text-primary">{percent}%</span>
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Getting started progress"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2.5 text-sm">
            {item.done ? (
              <CheckCircle2 size={18} className="shrink-0 text-primary" />
            ) : (
              <Circle size={18} className="shrink-0 text-muted-foreground/40" />
            )}
            <span
              className={
                item.done
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
};

export default GettingStartedCard;
