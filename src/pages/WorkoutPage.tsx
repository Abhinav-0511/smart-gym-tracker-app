import { useState } from "react";
import { Plus, Save, Timer, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExerciseCard from "@/components/ExerciseCard";
import GlassCard from "@/components/GlassCard";
import { weeklyPlan } from "@/data/mockData";
import type { Exercise } from "@/data/mockData";

const WorkoutPage = () => {
  const today = weeklyPlan[2];
  const [exercises, setExercises] = useState<Exercise[]>(today.exercises);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [notes, setNotes] = useState("");

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((e) => e.id !== id));
  };

  const addExercise = () => {
    const newEx: Exercise = {
      id: String(Date.now()),
      name: "New Exercise",
      sets: [
        { setNumber: 1, reps: 10, weight: 0, completed: false },
        { setNumber: 2, reps: 10, weight: 0, completed: false },
        { setNumber: 3, reps: 10, weight: 0, completed: false },
      ],
    };
    setExercises([...exercises, newEx]);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{today.type} Day</h1>
          <p className="text-sm text-muted-foreground">{today.day} · {exercises.length} exercises</p>
        </div>
        {workoutStarted && (
          <div className="flex items-center gap-1.5 text-primary">
            <Timer size={16} />
            <span className="text-sm font-mono font-medium">45:30</span>
          </div>
        )}
      </div>

      {/* Smart Feedback */}
      <GlassCard className="bg-gradient-to-r from-primary/5 to-transparent border-primary/10">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          <p className="text-sm text-foreground">
            You improved <span className="text-primary font-semibold">+5kg</span> on Bench Press last session!
          </p>
        </div>
      </GlassCard>

      {!workoutStarted ? (
        <Button size="lg" className="w-full" onClick={() => setWorkoutStarted(true)}>
          Start Workout
        </Button>
      ) : (
        <>
          {/* Exercise List */}
          <div className="space-y-3">
            {exercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} onRemove={removeExercise} />
            ))}
          </div>

          {/* Add Exercise */}
          <Button variant="outline" className="w-full" onClick={addExercise}>
            <Plus size={18} />
            Add Exercise
          </Button>

          {/* Notes */}
          <GlassCard>
            <label className="text-sm font-medium text-foreground block mb-2">Workout Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it feel? Any adjustments?"
              className="w-full bg-secondary rounded-xl p-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary resize-none h-20 placeholder:text-muted-foreground transition-all"
            />
          </GlassCard>

          {/* Save */}
          <Button size="lg" className="w-full" onClick={() => setWorkoutStarted(false)}>
            <Save size={18} />
            Save Workout
          </Button>
        </>
      )}
    </div>
  );
};

export default WorkoutPage;
