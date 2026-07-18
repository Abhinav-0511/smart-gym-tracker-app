import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  getUnseenAnnouncement,
  markAnnouncementSeen,
} from "./services/announcements";

/**
 * Surfaces admin announcements to a signed-in user. On app start it fetches the
 * most recent active announcement the user has not seen and pops it in a modal.
 * Dismissing marks it read, so each announcement is shown exactly once. It waits
 * until first-run onboarding is finished and never overlays the auth or admin
 * routes, mirroring OnboardingGate so the two never collide.
 */
const AnnouncementGate = () => {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const onSuppressedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/reset-password") ||
    pathname === "/";

  // Only interrupt an established user on a normal route — after onboarding.
  const eligible =
    Boolean(profile?.onboarding_completed_at) && !onSuppressedRoute;

  const queryKey = ["announcement", "unseen", profile?.id];

  const { data: announcement } = useQuery({
    queryKey,
    queryFn: getUnseenAnnouncement,
    enabled: eligible,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (announcement) setOpen(true);
  }, [announcement]);

  const dismiss = useMutation({
    mutationFn: (id: string) => markAnnouncementSeen(id),
    // Drop it from cache so it does not reappear on the next route change; a
    // failed write simply leaves it to be retried on the next app start.
    onSuccess: () => queryClient.setQueryData(queryKey, null),
  });

  if (!eligible || !announcement) return null;

  const close = () => {
    setOpen(false);
    dismiss.mutate(announcement.id);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 sm:mx-0">
            <Megaphone size={22} className="text-primary" />
          </div>
          <DialogTitle>{announcement.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap text-left text-sm text-foreground/80">
            {announcement.body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="w-full sm:w-auto" onClick={close}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementGate;
