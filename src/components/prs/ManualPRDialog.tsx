import { useEffect, useState, type FormEvent } from "react";
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
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ManualPRInput, PersonalRecord } from "@/types/personal-record";
import type { ExerciseCatalogItem } from "@/types/workout-plan";

interface ManualPRDialogProps {
  open: boolean;
  catalog: ExerciseCatalogItem[];
  record: PersonalRecord | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: ManualPRInput) => Promise<void>;
}

const ManualPRDialog = ({
  open,
  catalog,
  record,
  saving,
  onOpenChange,
  onSave,
}: ManualPRDialogProps) => {
  const [exerciseId, setExerciseId] = useState("");
  const [weight, setWeight] = useState("");
  const [achievedOn, setAchievedOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setExerciseId(record?.exerciseId ?? "");
    setWeight(record ? String(record.weightKg) : "");
    setAchievedOn(record?.achievedOn ?? new Date().toISOString().slice(0, 10));
    setError(null);
  }, [open, record]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedWeight = Number(weight);

    if (!exerciseId || !achievedOn) {
      setError("Exercise and date are required.");
      return;
    }
    if (!Number.isFinite(parsedWeight) || parsedWeight < 0) {
      setError("Weight must be zero or greater.");
      return;
    }

    try {
      await onSave({ exerciseId, weightKg: parsedWeight, achievedOn });
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn’t save record.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{record ? "Edit Manual PR" : "Add Manual PR"}</DialogTitle>
          <DialogDescription>
            Manual records remain separate from workout-detected records.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Exercise</Label>
            <Select value={exerciseId} onValueChange={setExerciseId} disabled={saving}>
              <SelectTrigger aria-label="Exercise">
                <SelectValue placeholder="Choose exercise" />
              </SelectTrigger>
              <SelectContent>
                {catalog.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pr-weight">Weight (kg)</Label>
            <NumericInput
              id="pr-weight"
              value={weight}
              placeholder="0"
              enterKeyHint="done"
              onValueChange={setWeight}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pr-date">Date</Label>
            <Input
              id="pr-date"
              type="date"
              value={achievedOn}
              onChange={(event) => setAchievedOn(event.target.value)}
              disabled={saving}
            />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              Save PR
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPRDialog;
