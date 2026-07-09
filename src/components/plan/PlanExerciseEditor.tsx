import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import type {
  PlannedExercise,
  PlannedSet,
  PlannedSetUpdate,
} from "@/types/workout-plan";

interface SetRowProps {
  plannedSet: PlannedSet;
  usesBodyweight: boolean;
  canRemove: boolean;
  disabled: boolean;
  onUpdate: (setId: string, updates: PlannedSetUpdate) => Promise<void>;
  onRemove: (setId: string) => Promise<void>;
}

const SetRow = ({
  plannedSet,
  usesBodyweight,
  canRemove,
  disabled,
  onUpdate,
  onRemove,
}: SetRowProps) => {
  const [reps, setReps] = useState(String(plannedSet.targetReps));
  const [weight, setWeight] = useState(
    plannedSet.targetWeightKg === null ? "" : String(plannedSet.targetWeightKg),
  );

  useEffect(() => {
    setReps(String(plannedSet.targetReps));
    setWeight(
      plannedSet.targetWeightKg === null ? "" : String(plannedSet.targetWeightKg),
    );
  }, [plannedSet.targetReps, plannedSet.targetWeightKg]);

  const saveReps = async () => {
    const nextReps = Number(reps);
    if (!Number.isInteger(nextReps) || nextReps < 1) {
      setReps(String(plannedSet.targetReps));
      return;
    }
    if (nextReps !== plannedSet.targetReps) {
      try {
        await onUpdate(plannedSet.id, { targetReps: nextReps });
      } catch {
        setReps(String(plannedSet.targetReps));
      }
    }
  };

  const saveWeight = async () => {
    const nextWeight = weight.trim() === "" ? null : Number(weight);
    if (nextWeight !== null && (!Number.isFinite(nextWeight) || nextWeight < 0)) {
      setWeight(
        plannedSet.targetWeightKg === null
          ? ""
          : String(plannedSet.targetWeightKg),
      );
      return;
    }
    if (nextWeight !== plannedSet.targetWeightKg) {
      try {
        await onUpdate(plannedSet.id, { targetWeightKg: nextWeight });
      } catch {
        setWeight(
          plannedSet.targetWeightKg === null
            ? ""
            : String(plannedSet.targetWeightKg),
        );
      }
    }
  };

  return (
    <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center">
      <span className="text-sm text-muted-foreground text-center">
        {plannedSet.setNumber}
      </span>
      <input
        aria-label={`Set ${plannedSet.setNumber} reps`}
        type="number"
        min={1}
        value={reps}
        disabled={disabled}
        onChange={(event) => setReps(event.target.value)}
        onBlur={() => void saveReps()}
        className="w-full min-w-0 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
      />
      <input
        aria-label={`Set ${plannedSet.setNumber} weight`}
        type="number"
        min={0}
        step="0.25"
        value={weight}
        disabled={disabled}
        placeholder={usesBodyweight ? "BW" : "0"}
        onChange={(event) => setWeight(event.target.value)}
        onBlur={() => void saveWeight()}
        className="w-full min-w-0 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        disabled={disabled || !canRemove}
        onClick={() => void onRemove(plannedSet.id)}
        aria-label={`Remove set ${plannedSet.setNumber}`}
      >
        <Minus size={14} />
      </Button>
    </div>
  );
};

interface PlanExerciseEditorProps {
  exercise: PlannedExercise;
  index: number;
  totalExercises: number;
  disabled: boolean;
  onMove: (fromIndex: number, toIndex: number) => Promise<void>;
  onRemoveExercise: (exerciseId: string) => Promise<void>;
  onUpdateSet: (setId: string, updates: PlannedSetUpdate) => Promise<void>;
  onAddSet: (exerciseId: string) => Promise<void>;
  onRemoveSet: (setId: string) => Promise<void>;
}

const PlanExerciseEditor = ({
  exercise,
  index,
  totalExercises,
  disabled,
  onMove,
  onRemoveExercise,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
}: PlanExerciseEditorProps) => (
  <GlassCard>
    <div className="flex items-start gap-3">
      <span className="text-xs text-muted-foreground font-mono w-5 pt-2">
        {index + 1}.
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">{exercise.name}</p>
        <p className="text-xs text-muted-foreground">
          {exercise.sets.length} {exercise.sets.length === 1 ? "set" : "sets"}
        </p>
      </div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled || index === 0}
          onClick={() => void onMove(index, index - 1)}
          aria-label={`Move ${exercise.name} up`}
        >
          <ArrowUp size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled || index === totalExercises - 1}
          onClick={() => void onMove(index, index + 1)}
          aria-label={`Move ${exercise.name} down`}
        >
          <ArrowDown size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          disabled={disabled}
          onClick={() => void onRemoveExercise(exercise.id)}
          aria-label={`Remove ${exercise.name}`}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>

    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 px-1 text-xs font-medium text-muted-foreground">
        <span>Set</span>
        <span>Reps</span>
        <span>Weight (kg)</span>
        <span />
      </div>
      {exercise.sets.map((plannedSet) => (
        <SetRow
          key={plannedSet.id}
          plannedSet={plannedSet}
          usesBodyweight={exercise.usesBodyweight}
          canRemove={exercise.sets.length > 1}
          disabled={disabled}
          onUpdate={onUpdateSet}
          onRemove={onRemoveSet}
        />
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full mt-1"
        disabled={disabled}
        onClick={() => void onAddSet(exercise.id)}
      >
        <Plus size={14} />
        Add Set
      </Button>
    </div>
  </GlassCard>
);

export default PlanExerciseEditor;
