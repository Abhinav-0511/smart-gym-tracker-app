import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, LoaderCircle, Mail } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import TicketStatusBadge from "@/features/admin/components/TicketStatusBadge";
import { AdminEmptyState, AdminError, AdminLoading } from "@/features/admin/components/AdminStates";
import { listTickets, updateTicket, type TicketStatus } from "@/features/admin/services/admin";
import { createScreenshotSignedUrl, type SupportTicket } from "@/features/help/services/support";

const STATUS_FILTERS: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_OPTIONS: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const CATEGORY_LABELS: Record<string, string> = {
  question: "Question",
  bug: "Bug",
  feature_request: "Feature Request",
  other: "Other",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Ticket triage: filter, open a ticket to view detail, reply and set status. */
const AdminTicketsPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [active, setActive] = useState<SupportTicket | null>(null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin", "tickets", filter],
    queryFn: () => listTickets(filter === "all" ? undefined : filter),
  });

  const [status, setStatus] = useState<TicketStatus>("open");
  const [reply, setReply] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    setStatus(active.status as TicketStatus);
    setReply(active.admin_reply ?? "");
    setScreenshotUrl(null);
    if (active.screenshot_url) {
      createScreenshotSignedUrl(active.screenshot_url)
        .then(setScreenshotUrl)
        .catch(() => setScreenshotUrl(null));
    }
  }, [active]);

  const mutation = useMutation({
    mutationFn: (payload: { id: string; status: TicketStatus; admin_reply: string }) =>
      updateTicket(payload.id, {
        status: payload.status,
        admin_reply: payload.admin_reply.trim() ? payload.admin_reply.trim() : null,
      }),
    onSuccess: () => {
      toast({ title: "Ticket updated", description: "Your changes were saved." });
      void queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
      setActive(null);
    },
    onError: (mutationError) => {
      toast({
        variant: "destructive",
        title: "Couldn’t update ticket",
        description:
          mutationError instanceof Error ? mutationError.message : "Please try again.",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              filter === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <AdminLoading label="Loading tickets" />
      ) : error ? (
        <AdminError
          message={error instanceof Error ? error.message : "Please try again."}
          onRetry={() => void refetch()}
        />
      ) : data.length === 0 ? (
        <AdminEmptyState
          icon={LifeBuoy}
          title="No tickets here"
          description="Support tickets submitted from the Help Center will appear here."
        />
      ) : (
        <div className="space-y-2">
          {data.map((ticket) => (
            <GlassCard
              key={ticket.id}
              hover
              onClick={() => setActive(ticket)}
              className="cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TicketStatusBadge status={ticket.status} />
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate font-semibold text-foreground">{ticket.subject}</p>
                  <p className="truncate text-sm text-muted-foreground">{ticket.description}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail size={12} /> {ticket.email}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatWhen(ticket.created_at)}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{active.subject}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2">
                  <TicketStatusBadge status={active.status} />
                  <span>{CATEGORY_LABELS[active.category] ?? active.category}</span>
                  <span>· {formatWhen(active.created_at)}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-xl bg-secondary/50 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Mail size={12} /> {active.email}
                  </p>
                  <p className="whitespace-pre-wrap text-foreground">{active.description}</p>
                </div>

                {active.screenshot_url && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Screenshot</p>
                    {screenshotUrl ? (
                      <a href={screenshotUrl} target="_blank" rel="noreferrer">
                        <img
                          src={screenshotUrl}
                          alt="Ticket screenshot"
                          className="max-h-64 w-full rounded-xl border border-border/60 object-contain"
                        />
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <LoaderCircle size={14} className="animate-spin" /> Loading image…
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-status">Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as TicketStatus)}>
                    <SelectTrigger id="ticket-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {STATUS_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-reply">Reply</Label>
                  <Textarea
                    id="ticket-reply"
                    value={reply}
                    maxLength={5000}
                    rows={4}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Write a reply for the user (saved on the ticket)."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActive(null)}>
                    Cancel
                  </Button>
                  <Button
                    disabled={mutation.isPending}
                    onClick={() =>
                      mutation.mutate({ id: active.id, status, admin_reply: reply })
                    }
                  >
                    {mutation.isPending && <LoaderCircle size={16} className="animate-spin" />}
                    Save changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTicketsPage;
