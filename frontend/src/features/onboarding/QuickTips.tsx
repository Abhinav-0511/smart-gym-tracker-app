import { LayoutGrid, LifeBuoy, UserCircle, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QuickTipsProps {
  open: boolean;
  onDismiss: () => void;
}

interface Tip {
  icon: LucideIcon;
  title: string;
  body: string;
}

/**
 * A one-time popup that orients a first-time user around the shell: where the
 * module switcher, profile and help/support controls live. Deliberately points
 * at real on-screen positions (top-left / top-right / header) rather than
 * abstract concepts — that is the onboarding carousel's job.
 */
const TIPS: Tip[] = [
  {
    icon: LayoutGrid,
    title: "Switch modules",
    body: "Tap the LifeTrack logo (top-left) to move between Fitness, Productivity and Finance.",
  },
  {
    icon: UserCircle,
    title: "Your profile",
    body: "Tap your avatar (top-right) for your stats, achievements and account settings.",
  },
  {
    icon: LifeBuoy,
    title: "Help & support",
    body: "The ? button in the header opens guides, feedback, and support tickets.",
  },
];

const QuickTips = ({ open, onDismiss }: QuickTipsProps) => {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Find your way around</DialogTitle>
          <DialogDescription>Three things worth knowing to get started.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3">
          {TIPS.map((tip) => (
            <li key={tip.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <tip.icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                <p className="text-sm text-muted-foreground">{tip.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button className="w-full" onClick={onDismiss}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickTips;
