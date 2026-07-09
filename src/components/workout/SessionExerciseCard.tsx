import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import type {
  WorkoutSessionExercise,
  WorkoutSessionSet,
  WorkoutSetUpdate,
} from "@/types/workout-session";

interface SessionSetRowProps {
  set: WorkoutSessionSet;
  usesBodyweight: boolean;
  disabled: boolean;
  onUpdate: (setId: string, updates: WorkoutSetUpdate) => Promise<void>;
}

const SessionSetRow = ({
  set,
  usesBodyweight,
  disabled,
  onUpdate,
}: SessionSetRowProps) => {
  const [reps, setReps] = useState(set.reps === null ? "" : String(set.reps));
  const [weight, setWeight] = useState(
    set.weightKg === null ? "" : String(set.weightKg),
  );

  useEffect(() => {
    setReps(set.reps === null ? "" : String(set.reps));
    setWeight(set.weightKg === null ? "" : String(set.weightKg));
  }, [set.reps, set.weightKg]);

  const saveReps = async () => {
    const value = reps.trim() === "" ? null : Number(reps);
    if (value !== null && (!Number.isInteger(value) || value < 0)) {
      setReps(set.reps === null ? "" : String(set.reps));
      return;
    }
    if (value !== set.reps) {
      try {
        await onUpdate(set.id, { reps: value });
      } catch {
        setReps(set.reps === null ? "" : String(set.reps));
      }
    }
  };

  const saveWeight = async () => {
    const value = weight.trim() === "" ? null : Number(weight);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      setWeight(set.weightKg === null ? "" : String(set.weightKg));
      return;
    }
    if (value !== set.weightKg) {
      try {
        await onUpdate(set.id, { weightKg: value });
      } catch {
        setWeight(set.weightKg === null ? "" : String(set.weightKg));
      }
    }
  };

  return (
    <div className={`grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2 rounded-xl transition-colors duration-200 ${set.isCompleted ? "bg-primary/[.06]" : ""}`}>
      <span className="text-sm text-muted-foreground text-center">{set.setNumber}</span>
      <input
        aria-label={`Set ${set.setNumber} actual reps`}
        type="number"
        min={0}
        value={reps}
        disabled={disabled || set.isCompleted}
        onChange={(event) => setReps(event.target.value)}
        onBlur={() => void saveReps()}
        className="h-11 rounded-xl border border-transparent bg-secondary px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
      />
      <input
        aria-label={`Set ${set.setNumber} actual weight`}
        type="number"
        min={0}
        step="0.25"
        value={weight}
        disabled={disabled || set.isCompleted}
        placeholder={usesBodyweight ? "BW" : "0"}
        onChange={(event) => setWeight(event.target.value)}
        onBlur={() => void saveWeight()}
        className="h-11 rounded-xl border border-transparent bg-secondary px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
      />
      <Button
        variant={set.isCompleted ? "default" : "ghost"}
        size="icon"
        className={`h-11 w-11 transition-transform duration-200 ${set.isCompleted ? "scale-100" : "scale-95"}`}
        disabled={disabled || (!set.isCompleted && reps.trim() === "")}
        onClick={() =>
          void onUpdate(set.id, { isCompleted: !set.isCompleted })
        }
        aria-label={`${set.isCompleted ? "Reopen" : "Complete"} set ${set.setNumber}`}
      >
        <Check size={14} />
      </Button>
    </div>
  );
};

interface SessionExerciseCardProps {
  exercise: WorkoutSessionExercise;
  disabled: boolean;
  onUpdateSet: (setId: string, updates: WorkoutSetUpdate) => Promise<void>;
  onRemove: (exerciseId: string) => Promise<void>;
}

const SessionExerciseCard = ({
  exercise,
  disabled,
  onUpdateSet,
  onRemove,
}: SessionExerciseCardProps) => {
  const [expanded, setExpanded] = useState(true);
  const completedSets = exercise.sets.filter((set) => set.isCompleted).length;

  return (
    <GlassCard className="animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{exercise.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedSets}/{exercise.sets.length} sets completed
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground hover:text-destructive"
            disabled={disabled}
            onClick={() => void onRemove(exercise.id)}
            aria-label={`Remove ${exercise.name}`}
          >
            <X size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${exercise.name}`}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-[2rem_1fr_1fr_2.75rem] gap-2 px-1 text-xs font-medium text-muted-foreground">
            <span>Set</span>
            <span>Reps</span>
            <span>Weight (kg)</span>
            <span />
          </div>
          {exercise.sets.map((set) => (
            <SessionSetRow
              key={set.id}
              set={set}
              usesBodyweight={exercise.usesBodyweight}
              disabled={disabled}
              onUpdate={onUpdateSet}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default SessionExerciseCard;
