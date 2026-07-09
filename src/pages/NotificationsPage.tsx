import { ArrowRight, BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NotificationsPageProps {
  onNavigate: (page: string) => void;
}

const NotificationsPage = ({ onNavigate }: NotificationsPageProps) => {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BellRing size={22} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">Stay on top of your latest workout activity and milestones.</p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-background/70 p-6 text-sm text-muted-foreground">
        Your notification center is available from the top bar. Open it anytime to review updates and account activity.
      </div>
      <Button className="mt-6" onClick={() => onNavigate("home")} variant="outline">
        Back to dashboard
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default NotificationsPage;
