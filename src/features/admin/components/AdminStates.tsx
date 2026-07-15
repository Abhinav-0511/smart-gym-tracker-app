import { AlertCircle, Inbox, LoaderCircle, type LucideIcon } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";

/** Centered spinner block for admin data sections. */
export const AdminLoading = ({ label = "Loading" }: { label?: string }) => (
  <div
    className="flex items-center justify-center gap-2 py-16 text-muted-foreground"
    role="status"
    aria-label={label}
  >
    <LoaderCircle size={18} className="animate-spin" />
    <span className="text-sm">{label}…</span>
  </div>
);

/** Error block with an optional retry. */
export const AdminError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <GlassCard className="py-10 text-center">
    <AlertCircle size={24} className="mx-auto mb-3 text-destructive" />
    <p className="font-semibold text-foreground">Something went wrong</p>
    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
    {onRetry && (
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    )}
  </GlassCard>
);

/** Empty-state block. */
export const AdminEmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) => (
  <GlassCard className="py-12 text-center">
    <Icon size={26} className="mx-auto mb-3 text-muted-foreground" />
    <p className="font-semibold text-foreground">{title}</p>
    {description && (
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    )}
  </GlassCard>
);
