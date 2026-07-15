import { useCallback, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import {
  undoGuardKey,
  useUndoGuard,
  type UndoKind,
} from "@/features/productivity/lib/undo-guard";

export interface PendingUndo {
  kind: UndoKind;
  title: string;
  guardKey: string;
  /** Runs the actual toggle mutation once the user confirms the undo. */
  run: () => void;
}

interface RequestToggleOptions {
  kind: UndoKind;
  id: string;
  /** The day the completion belongs to (today, or a Calendar day). */
  dateKey: string;
  /** True when the item is currently done — so this click is an undo. */
  isDone: boolean;
  title: string;
  /** Performs the real toggle (complete or uncomplete) mutation. */
  run: () => void;
}

/**
 * Shared completion/undo flow for tasks and habits. Marking something done runs
 * immediately; undoing a done item asks for confirmation and is only allowed
 * once per day — after that single undo is spent, the item locks as done (see
 * [[undo-guard]]). Used by the Dashboard, Habits page and Calendar so all three
 * behave identically. Pair with `UndoConfirmDialog`, feeding it `pending`.
 */
export function useUndoConfirm(todayKey: string) {
  const { toast } = useToast();
  const { isConsumed, consume } = useUndoGuard(todayKey);
  const [pending, setPending] = useState<PendingUndo | null>(null);

  const isLocked = useCallback(
    (kind: UndoKind, id: string, dateKey: string) => isConsumed(undoGuardKey(kind, id, dateKey)),
    [isConsumed],
  );

  const requestToggle = useCallback(
    ({ kind, id, dateKey, isDone, title, run }: RequestToggleOptions) => {
      if (!isDone) {
        // Completing is immediate — no confirmation needed.
        run();
        return;
      }
      const guardKey = undoGuardKey(kind, id, dateKey);
      if (isConsumed(guardKey)) {
        toast({
          title: "Already undone once",
          description: "This was undone earlier, so it's now locked as done for the day.",
        });
        return;
      }
      setPending({ kind, title, guardKey, run });
    },
    [isConsumed, toast],
  );

  const confirm = useCallback(() => {
    if (!pending) return;
    pending.run();
    // Spend the single allowed undo for this item + day.
    consume(pending.guardKey);
    setPending(null);
  }, [pending, consume]);

  const cancel = useCallback(() => setPending(null), []);

  return { requestToggle, isLocked, pending, confirm, cancel };
}
