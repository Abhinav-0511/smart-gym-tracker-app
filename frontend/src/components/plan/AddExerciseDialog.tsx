import { useState } from "react";

import ExercisePicker from "@/components/exercises/ExercisePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExerciseCatalogItem } from "@/types/workout-plan";

interface AddExerciseDialogProps {
  open: boolean;
  catalog: ExerciseCatalogItem[];
  existingExerciseIds: string[];
  saving: boolean;
  creating?: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (exerciseId: string) => Promise<void>;
  onCreate?: (name: string) => Promise<ExerciseCatalogItem>;
}

const AddExerciseDialog = ({
  open,
  catalog,
  existingExerciseIds,
  saving,
  creating = false,
  onOpenChange,
  onAdd,
  onCreate,
}: AddExerciseDialogProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (exercise: ExerciseCatalogItem) => {
    try {
      setError(null);
      await onAdd(exercise.id);
      onOpenChange(false);
    } catch (addError) {
      const message =
        addError instanceof Error ? addError.message : "Couldn’t add exercise.";
      setError(message);
      throw addError;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saving && !creating) {
          setError(null);
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogDescription>
            Search the catalog or create an exercise. Three starter sets will be added.
          </DialogDescription>
        </DialogHeader>
        <ExercisePicker
          key={open ? "open" : "closed"}
          exercises={catalog}
          excludedExerciseIds={existingExerciseIds}
          busy={saving || creating}
          onSelect={handleSelect}
          onCreate={onCreate}
        />
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving || creating}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExerciseDialog;
