import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, LoaderCircle } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCheckin } from "@/hooks/useCheckin";
import type { DailyCheckin } from "@/types/checkin";

const RATING_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);

function toNumberOrNull(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

interface WorkoutCheckinCardProps {
  userId: string;
  /** The date (YYYY-MM-DD) this check-in belongs to — the day of the workout being logged. */
  date: string;
}

/**
 * The Daily Check-in, embedded directly in the workout flow instead of living
 * on its own page — logging today's numbers happens right alongside today's
 * training. Only the date is required; every field here is optional.
 */
const WorkoutCheckinCard = ({ userId, date }: WorkoutCheckinCardProps) => {
  const { toast } = useToast();
  const { recentCheckinsQuery, saveMutation } = useCheckin(userId);
  const existing: DailyCheckin | null =
    recentCheckinsQuery.data?.find((entry) => entry.checkinDate === date) ?? null;

  const [expanded, setExpanded] = useState(false);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [sleep, setSleep] = useState("");
  const [steps, setSteps] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [water, setWater] = useState("");
  const [energy, setEnergy] = useState("");
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  useEffect(() => {
    if (hydratedFor === date || !recentCheckinsQuery.data) return;
    setWeight(existing?.weightKg?.toString() ?? "");
    setWaist(existing?.waistCm?.toString() ?? "");
    setSleep(existing?.sleepHours?.toString() ?? "");
    setSteps(existing?.steps?.toString() ?? "");
    setCalories(existing?.calories?.toString() ?? "");
    setProtein(existing?.proteinG?.toString() ?? "");
    setWater(existing?.waterLiters?.toString() ?? "");
    setEnergy(existing?.energy?.toString() ?? "");
    setMood(existing?.mood?.toString() ?? "");
    setNotes(existing?.notes ?? "");
    setHydratedFor(date);
  }, [date, existing, hydratedFor, recentCheckinsQuery.data]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        checkinDate: date,
        weightKg: toNumberOrNull(weight),
        waistCm: toNumberOrNull(waist),
        sleepHours: toNumberOrNull(sleep),
        steps: toNumberOrNull(steps),
        calories: toNumberOrNull(calories),
        proteinG: toNumberOrNull(protein),
        waterLiters: toNumberOrNull(water),
        energy: toNumberOrNull(energy),
        mood: toNumberOrNull(mood),
        notes: notes.trim() || null,
      });
      toast({ title: "Check-in saved" });
      setExpanded(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Check-in couldn’t be saved",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <GlassCard>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {existing ? (
            <CheckCircle2 size={18} className="text-primary" />
          ) : (
            <ClipboardCheck size={18} className="text-primary" />
          )}
          <div>
            <h3 className="font-semibold text-foreground">Today’s Check-in</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {existing
                ? "Saved — tap to review or update."
                : "Weight, waist, sleep, steps — takes under a minute."}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="workout-checkin-weight">Weight (kg)</Label>
              <NumericInput
                id="workout-checkin-weight"
                variant="decimal"
                value={weight}
                onValueChange={setWeight}
                placeholder="76.0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workout-checkin-waist">Waist (cm)</Label>
              <NumericInput
                id="workout-checkin-waist"
                variant="decimal"
                value={waist}
                onValueChange={setWaist}
                placeholder="89"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="workout-checkin-sleep">Sleep (hours)</Label>
              <NumericInput
                id="workout-checkin-sleep"
                variant="decimal"
                value={sleep}
                onValueChange={setSleep}
                placeholder="7.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workout-checkin-steps">Steps</Label>
              <NumericInput
                id="workout-checkin-steps"
                variant="integer"
                value={steps}
                onValueChange={setSteps}
                placeholder="8000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="workout-checkin-calories">Calories</Label>
              <NumericInput
                id="workout-checkin-calories"
                variant="integer"
                value={calories}
                onValueChange={setCalories}
                placeholder="2200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workout-checkin-protein">Protein (g)</Label>
              <NumericInput
                id="workout-checkin-protein"
                variant="decimal"
                value={protein}
                onValueChange={setProtein}
                placeholder="145"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workout-checkin-water">Water (liters)</Label>
            <NumericInput
              id="workout-checkin-water"
              variant="decimal"
              value={water}
              onValueChange={setWater}
              placeholder="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="workout-checkin-energy">Energy (1–10)</Label>
              <select
                id="workout-checkin-energy"
                value={energy}
                onChange={(event) => setEnergy(event.target.value)}
                className="h-10 w-full rounded-xl border border-transparent bg-secondary px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              >
                <option value="">–</option>
                {RATING_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workout-checkin-mood">Mood (1–10)</Label>
              <select
                id="workout-checkin-mood"
                value={mood}
                onChange={(event) => setMood(event.target.value)}
                className="h-10 w-full rounded-xl border border-transparent bg-secondary px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              >
                <option value="">–</option>
                {RATING_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workout-checkin-notes">Notes</Label>
            <Textarea
              id="workout-checkin-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
              placeholder="Anything worth remembering about today?"
              className="h-20 resize-none"
            />
          </div>

          <Button
            className="w-full"
            disabled={saveMutation.isPending}
            onClick={() => void handleSave()}
          >
            {saveMutation.isPending ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Save Check-in
          </Button>
        </div>
      )}
    </GlassCard>
  );
};

export default WorkoutCheckinCard;
