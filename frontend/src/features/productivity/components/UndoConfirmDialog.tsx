import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PendingUndo } from "@/features/productivity/hooks/useUndoConfirm";

interface UndoConfirmDialogProps {
  pending: PendingUndo | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation shown before undoing a completed task/habit. Driven by
 * `useUndoConfirm` — render it once per page and pass the hook's `pending`,
 * `confirm` and `cancel`.
 */
const UndoConfirmDialog = ({ pending, onConfirm, onCancel }: UndoConfirmDialogProps) => (
  <AlertDialog open={pending !== null} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Undo this {pending?.kind === "habit" ? "habit" : "task"}?
        </AlertDialogTitle>
        <AlertDialogDescription>
          “{pending?.title}” will be marked as not done again. You can only undo it once — after
          this, completing it again will lock it as done for the day.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep it done</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Undo</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default UndoConfirmDialog;
