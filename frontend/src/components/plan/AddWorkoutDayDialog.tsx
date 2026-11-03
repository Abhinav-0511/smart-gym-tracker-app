import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WEEKDAYS } from "@/types/workout-plan";

interface AddWorkoutDayDialogProps {
  open: boolean;
  unavailableDays: number[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (dayOfWeek: number, workoutType: string) => Promise<void>;
}

const AddWorkoutDayDialog = ({
  open,
  unavailableDays,
  saving,
  onOpenChange,
  onAdd,
}: AddWorkoutDayDialogProps) => {
  const unavailableDaysKey = [...unavailableDays].sort().join(",");
  const availableDays = useMemo(() => {
    const unavailable = new Set(
      unavailableDaysKey
        .split(",")
        .filter(Boolean)
        .map(Number),
    );
    return WEEKDAYS
      .map((weekday, index) => ({ ...weekday, dayOfWeek: index + 1 }))
      .filter(({ dayOfWeek }) => !unavailable.has(dayOfWeek));
  }, [unavailableDaysKey]);
  const [dayOfWeek, setDayOfWeek] = useState(
    availableDays[0]?.dayOfWeek.toString() ?? "",
  );
  const [workoutType, setWorkoutType] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDayOfWeek(availableDays[0]?.dayOfWeek.toString() ?? "");
    setWorkoutType("");
    setError(null);
  }, [availableDays, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedType = workoutType.trim();

    if (!dayOfWeek) {
      setError("All seven days are already scheduled.");
      return;
    }
    if (!normalizedType) {
      setError("Workout type is required.");
      return;
    }

    try {
      await onAdd(Number(dayOfWeek), normalizedType);
      onOpenChange(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Couldn’t add the workout day.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Workout Day</DialogTitle>
          <DialogDescription>
            Choose a day and give its training session a name.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Day</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek} disabled={saving}>
              <SelectTrigger aria-label="Workout day">
                <SelectValue placeholder="Choose a day" />
              </SelectTrigger>
              <SelectContent>
                {availableDays.map((weekday) => (
                  <SelectItem
                    key={weekday.dayOfWeek}
                    value={weekday.dayOfWeek.toString()}
                  >
                    {weekday.day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workout-type">Workout type</Label>
            <Input
              id="workout-type"
              value={workoutType}
              onChange={(event) => setWorkoutType(event.target.value)}
              placeholder="Push, Pull, Legs…"
              maxLength={50}
              disabled={saving}
              autoCapitalize="words"
              enterKeyHint="done"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || availableDays.length === 0}>
              {saving && <LoaderCircle className="animate-spin" />}
              Add Day
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWorkoutDayDialog;
