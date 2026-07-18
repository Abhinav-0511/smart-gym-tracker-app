import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Megaphone, Send, Trash2 } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AdminEmptyState, AdminError, AdminLoading } from "@/features/admin/components/AdminStates";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  setAnnouncementActive,
} from "@/features/admin/services/admin";

const TITLE_MAX = 120;
const BODY_MAX = 2000;

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Admin Announcements. Compose a message that is broadcast to every user and
 * shown to each of them exactly once on their next app start. Existing
 * announcements can be toggled active/inactive (inactive ones stop appearing for
 * users who have not yet seen them) or deleted outright.
 */
const AdminAnnouncementsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: listAnnouncements,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });

  const createMutation = useMutation({
    mutationFn: () => createAnnouncement({ title, body }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      toast({
        title: "Announcement published",
        description: "Every user will see it once on their next visit.",
      });
      void invalidate();
    },
    onError: (mutationError) => {
      toast({
        variant: "destructive",
        title: "Couldn’t publish announcement",
        description:
          mutationError instanceof Error ? mutationError.message : "Please try again.",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setAnnouncementActive(id, isActive),
    onSuccess: () => void invalidate(),
    onError: (mutationError) => {
      toast({
        variant: "destructive",
        title: "Couldn’t update announcement",
        description:
          mutationError instanceof Error ? mutationError.message : "Please try again.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      toast({ title: "Announcement deleted" });
      void invalidate();
    },
    onError: (mutationError) => {
      toast({
        variant: "destructive",
        title: "Couldn’t delete announcement",
        description:
          mutationError instanceof Error ? mutationError.message : "Please try again.",
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createMutation.isPending) return;
    if (!title.trim() || !body.trim()) {
      toast({
        variant: "destructive",
        title: "Missing details",
        description: "Please add a title and a message.",
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">New announcement</h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What do you want everyone to know?"
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="announcement-body">Message</Label>
            <Textarea
              id="announcement-body"
              value={body}
              maxLength={BODY_MAX}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the announcement your users will see once, at the start."
              rows={5}
              disabled={createMutation.isPending}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {body.length}/{BODY_MAX}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {createMutation.isPending ? "Publishing…" : "Publish to all users"}
          </Button>
        </form>
      </GlassCard>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Published announcements</h2>

        {isPending ? (
          <AdminLoading label="Loading announcements" />
        ) : error ? (
          <AdminError
            message={error instanceof Error ? error.message : "Please try again."}
            onRetry={() => void refetch()}
          />
        ) : data.length === 0 ? (
          <AdminEmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Anything you publish here is shown once to every user on their next visit."
          />
        ) : (
          <div className="space-y-2">
            {data.map((item) => (
              <GlassCard key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          item.is_active
                            ? "bg-primary/15 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">
                      {item.body}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {formatWhen(item.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      Active
                      <Switch
                        checked={item.is_active}
                        disabled={toggleMutation.isPending}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: item.id, isActive: checked })
                        }
                        aria-label="Toggle announcement active"
                      />
                    </label>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-medium text-destructive hover:underline disabled:opacity-60"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncementsPage;
