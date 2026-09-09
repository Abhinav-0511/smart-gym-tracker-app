import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Minus, Plus, TrendingUp, X } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  sanitizeDecimalString,
  sanitizeIntegerString,
} from "@/lib/input-sanitizers";
import type {
  Rir,
  SetType,
  WorkoutSessionExercise,
  WorkoutSessionSet,
  WorkoutSetUpdate,
} from "@/types/workout-session";

const RIR_OPTIONS: { value: Rir; label: string }[] = [
  { value: 0, label: "0" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4+" },
];

const SET_ROW_GRID =
  "grid grid-cols-[1.75rem_1fr_1fr_3rem_2.5rem_2.5rem] items-center gap-1.5 sm:grid-cols-[2.25rem_1fr_1fr_3.5rem_2.75rem_2.75rem] sm:gap-2";

interface SessionSetRowProps {
  set: WorkoutSessionSet;
  usesBodyweight: boolean;
  disabled: boolean;
  canRemove: boolean;
  /** When true, reopening a completed set asks for confirmation first. */
  confirmReopen: boolean;
  onUpdate: (setId: string, updates: WorkoutSetUpdate) => Promise<void>;
  onRemove: (setId: string) => Promise<void>;
}

const SessionSetRow = ({
  set,
  usesBodyweight,
  disabled,
  canRemove,
  confirmReopen,
  onUpdate,
  onRemove,
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

  const handleToggleComplete = () => {
    // Reopening a completed set in a saved workout rewrites history/PRs, so
    // confirm the intent each time rather than letting it toggle silently.
    if (set.isCompleted && confirmReopen) {
      const confirmed = window.confirm(
        "Reopen this set? This is a saved workout, so the change will update your history, progress, and PRs.",
      );
      if (!confirmed) return;
    }
    void onUpdate(set.id, { isCompleted: !set.isCompleted });
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

  const handleRirChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = event.target.value;
    void onUpdate(set.id, { rir: raw === "" ? null : (Number(raw) as Rir) });
  };

  const toggleSetType = () => {
    void onUpdate(set.id, { setType: set.setType === "warmup" ? "working" : "warmup" });
  };

  return (
    <div className={`${SET_ROW_GRID} rounded-xl transition-colors duration-200 ${set.isCompleted ? "bg-primary/[.06]" : ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleSetType}
        title={set.setType === "warmup" ? "Warm-up set — tap to mark as working" : "Working set — tap to mark as warm-up"}
        className={`flex h-11 items-center justify-center rounded-xl text-xs font-medium transition-colors ${
          set.setType === "warmup"
            ? "bg-amber-500/15 text-amber-500"
            : "text-muted-foreground"
        }`}
      >
        {set.setType === "warmup" ? "W" : set.setNumber}
      </button>
      <input
        aria-label={`Set ${set.setNumber} actual reps`}
        type="text"
        inputMode="numeric"
        enterKeyHint="next"
        autoComplete="off"
        value={reps}
        disabled={disabled || set.isCompleted}
        onChange={(event) => setReps(sanitizeIntegerString(event.target.value))}
        onBlur={() => void saveReps()}
        className="h-11 w-full min-w-0 rounded-xl border border-transparent bg-secondary px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
      />
      <input
        aria-label={`Set ${set.setNumber} actual weight`}
        type="text"
        inputMode="decimal"
        enterKeyHint="done"
        autoComplete="off"
        value={weight}
        disabled={disabled || set.isCompleted}
        placeholder={usesBodyweight ? "BW" : "0"}
        onChange={(event) => setWeight(sanitizeDecimalString(event.target.value))}
        onBlur={() => void saveWeight()}
        className="h-11 w-full min-w-0 rounded-xl border border-transparent bg-secondary px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
      />
      <select
        aria-label={`Set ${set.setNumber} RIR (reps in reserve)`}
        value={set.rir === null ? "" : String(set.rir)}
        disabled={disabled || set.isCompleted}
        onChange={handleRirChange}
        className="h-11 w-full min-w-0 rounded-xl border border-transparent bg-secondary px-1 text-center text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
      >
        <option value="">–</option>
        {RIR_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Button
        variant={set.isCompleted ? "default" : "ghost"}
        size="icon"
        className={`h-11 w-full transition-transform duration-200 ${set.isCompleted ? "scale-100" : "scale-95"}`}
        disabled={disabled || (!set.isCompleted && reps.trim() === "")}
        onClick={handleToggleComplete}
        aria-label={`${set.isCompleted ? "Reopen" : "Complete"} set ${set.setNumber}`}
      >
        <Check size={14} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-full text-muted-foreground hover:text-destructive"
        disabled={disabled || !canRemove}
        onClick={() => void onRemove(set.id)}
        aria-label={`Remove set ${set.setNumber}`}
      >
        <Minus size={14} />
      </Button>
    </div>
  );
};

interface SessionExerciseCardProps {
  exercise: WorkoutSessionExercise;
  disabled: boolean;
  /** When true, reopening completed sets asks for confirmation (saved workouts). */
  confirmReopen: boolean;
  /** Read-only line summarizing the most recent prior session for this exercise. */
  previousSetsSummary?: string | null;
  /** Neutral, non-prescriptive progressive-overload note. Never auto-changes weight. */
  overloadHint?: string | null;
  onUpdateSet: (setId: string, updates: WorkoutSetUpdate) => Promise<void>;
  onAddSet: (exerciseId: string, setType: SetType) => Promise<void>;
  onRemoveSet: (setId: string) => Promise<void>;
  onRemove: (exerciseId: string) => Promise<void>;
}

const SessionExerciseCard = ({
  exercise,
  disabled,
  confirmReopen,
  previousSetsSummary,
  overloadHint,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
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
          {previousSetsSummary && (
            <p className="text-xs text-muted-foreground mt-1">
              Previous: <span className="text-foreground/80">{previousSetsSummary}</span>
            </p>
          )}
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

      {overloadHint && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-xs text-muted-foreground">
          <TrendingUp size={13} className="mt-0.5 shrink-0" />
          <span>{overloadHint}</span>
        </div>
      )}

      {expanded && (
        <div className="mt-3 space-y-2">
          <div className={`${SET_ROW_GRID} px-1 text-xs font-medium text-muted-foreground`}>
            <span>Set</span>
            <span>Reps</span>
            <span>Weight (kg)</span>
            <span>RIR</span>
            <span />
            <span />
          </div>
          {exercise.sets.map((set) => (
            <SessionSetRow
              key={set.id}
              set={set}
              usesBodyweight={exercise.usesBodyweight}
              disabled={disabled}
              canRemove={exercise.sets.length > 1}
              confirmReopen={confirmReopen}
              onUpdate={onUpdateSet}
              onRemove={onRemoveSet}
            />
          ))}
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={disabled}
              onClick={() => void onAddSet(exercise.id, "warmup")}
            >
              <Plus size={14} />
              Warm-up Set
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={disabled}
              onClick={() => void onAddSet(exercise.id, "working")}
            >
              <Plus size={14} />
              Working Set
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default SessionExerciseCard;
