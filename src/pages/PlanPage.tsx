import { useState } from "react";
import { ChevronRight, Edit3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { weeklyPlan } from "@/data/mockData";
import type { WorkoutDay } from "@/data/mockData";

const PlanPage = () => {
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workout Plan</h1>
          <p className="text-sm text-muted-foreground">Push / Pull / Legs · 6 days</p>
        </div>
        <Button variant="glass" size="sm">
          <Sparkles size={14} />
          Generate
        </Button>
      </div>

      {!selectedDay ? (
        <div className="space-y-3">
          {weeklyPlan.map((day) => (
            <GlassCard
              key={day.day}
              hover
              className="group"
              onClick={() => day.type !== "Rest" && setSelectedDay(day)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                    day.completed
                      ? "bg-primary/15 text-primary"
                      : day.type === "Rest"
                      ? "bg-secondary text-muted-foreground"
                      : "bg-secondary text-foreground"
                  }`}>
                    {day.shortDay}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{day.type}</h3>
                    <p className="text-xs text-muted-foreground">
                      {day.type === "Rest" ? "Recovery day" : `${day.exercises.length} exercises`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {day.completed && (
                    <span className="text-xs bg-primary/15 text-primary px-2 py-1 rounded-lg font-medium">Done</span>
                  )}
                  {day.type !== "Rest" && (
                    <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
            ← Back to Plan
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{selectedDay.day} — {selectedDay.type}</h2>
              <p className="text-sm text-muted-foreground">{selectedDay.exercises.length} exercises</p>
            </div>
            <Button variant="glass" size="sm">
              <Edit3 size={14} />
              Edit
            </Button>
          </div>
          <div className="space-y-2">
            {selectedDay.exercises.map((ex, i) => (
              <GlassCard key={ex.id}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono w-5">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ex.sets.length} sets · {ex.sets[0].reps} reps
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {ex.sets[0].weight > 0 ? `${ex.sets[0].weight}kg` : "BW"}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanPage;
