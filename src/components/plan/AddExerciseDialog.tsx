import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExerciseCatalogItem } from "@/types/workout-plan";

interface AddExerciseDialogProps {
  open: boolean;
  catalog: ExerciseCatalogItem[];
  existingExerciseIds: string[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (exerciseId: string) => Promise<void>;
}

const AddExerciseDialog = ({
  open,
  catalog,
  existingExerciseIds,
  saving,
  onOpenChange,
  onAdd,
}: AddExerciseDialogProps) => {
  const [exerciseId, setExerciseId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const availableExercises = useMemo(
    () => catalog.filter((exercise) => !existingExerciseIds.includes(exercise.id)),
    [catalog, existingExerciseIds],
  );

  useEffect(() => {
    if (open) {
      setExerciseId("");
      setError(null);
    }
  }, [open]);

  const handleAdd = async () => {
    if (!exerciseId) {
      setError("Choose an exercise to add.");
      return;
    }

    try {
      await onAdd(exerciseId);
      onOpenChange(false);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Couldn’t add exercise.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogDescription>Add a catalog exercise with three starter sets.</DialogDescription>
        </DialogHeader>
        {availableExercises.length ? (
          <Select value={exerciseId} onValueChange={setExerciseId} disabled={saving}>
            <SelectTrigger aria-label="Exercise">
              <SelectValue placeholder="Choose an exercise" />
            </SelectTrigger>
            <SelectContent>
              {availableExercises.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">
            Every catalog exercise is already included in this day.
          </p>
        )}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={saving || !availableExercises.length}
            onClick={() => void handleAdd()}
          >
            {saving && <LoaderCircle className="animate-spin" />}
            Add Exercise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExerciseDialog;
