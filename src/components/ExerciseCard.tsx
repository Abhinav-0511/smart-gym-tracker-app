import { useState } from "react";
import { Check, X, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import GlassCard from "./GlassCard";
import { Button } from "./ui/button";
import type { Exercise } from "@/data/mockData";

interface ExerciseCardProps {
  exercise: Exercise;
  onUpdate?: (exercise: Exercise) => void;
  onRemove?: (id: string) => void;
}

const ExerciseCard = ({ exercise, onRemove }: ExerciseCardProps) => {
  const [expanded, setExpanded] = useState(true);
  const [sets, setSets] = useState(exercise.sets);

  const toggleSet = (index: number) => {
    const updated = [...sets];
    updated[index] = { ...updated[index], completed: !updated[index].completed };
    setSets(updated);
  };

  const updateWeight = (index: number, weight: string) => {
    const updated = [...sets];
    updated[index] = { ...updated[index], weight: parseFloat(weight) || 0 };
    setSets(updated);
  };

  const completedSets = sets.filter((s) => s.completed).length;

  return (
    <GlassCard className="animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{exercise.name}</h3>
            {exercise.previousBest && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <TrendingUp size={12} /> {exercise.previousBest}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedSets}/{sets.length} sets completed
          </p>
        </div>
        <div className="flex items-center gap-1">
          {onRemove && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onRemove(exercise.id)}>
              <X size={16} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-xs text-muted-foreground font-medium px-1">
            <span>Set</span><span>Reps</span><span>Weight (kg)</span><span></span>
          </div>
          {sets.map((set, i) => (
            <div key={i} className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center">
              <span className="text-sm text-muted-foreground text-center">{set.setNumber}</span>
              <div className="bg-secondary rounded-lg px-3 py-2 text-sm text-foreground">{set.reps}</div>
              <input
                type="number"
                value={set.weight || ""}
                onChange={(e) => updateWeight(i, e.target.value)}
                className="bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary transition-all"
                placeholder="0"
              />
              <Button
                variant={set.completed ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleSet(i)}
              >
                <Check size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default ExerciseCard;
