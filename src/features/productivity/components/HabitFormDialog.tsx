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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getHabitColorClasses } from "@/features/productivity/lib/habit-colors";
import { getHabitIcon, HABIT_ICON_NAMES } from "@/features/productivity/lib/habit-icons";
import {
  HABIT_CATEGORIES,
  HABIT_COLORS,
  type CreateHabitInput,
  type HabitCategory,
  type HabitColor,
  type HabitFrequency,
  type IsoWeekday,
} from "@/features/productivity/types/habit";
import type { Habit } from "@/features/productivity/types/habit";
import { cn } from "@/lib/utils";

const WEEKDAYS: { value: IsoWeekday; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

interface HabitFormDialogProps {
  open: boolean;
  habit: Habit | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateHabitInput) => Promise<void>;
}

const HabitFormDialog = ({ open, habit, saving, onOpenChange, onSubmit }: HabitFormDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<HabitCategory>("health");
  const [icon, setIcon] = useState<string>("circle-check");
  const [color, setColor] = useState<HabitColor>("blue");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [customDays, setCustomDays] = useState<IsoWeekday[]>([1, 2, 3, 4, 5]);
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(habit?.title ?? "");
    setDescription(habit?.description ?? "");
    setCategory(habit?.category ?? "health");
    setIcon(habit?.icon ?? "circle-check");
    setColor(habit?.color ?? "blue");
    setFrequency(habit?.frequency ?? "daily");
    setCustomDays(habit?.customDays ?? [1, 2, 3, 4, 5]);
    setTargetValue(habit?.targetValue != null ? String(habit.targetValue) : "");
    setUnit(habit?.unit ?? "");
    setReminderEnabled(habit?.reminderEnabled ?? false);
    setReminderTime(habit?.reminderTime?.slice(0, 5) ?? "08:00");
    setError(null);
  }, [open, habit]);

  const toggleDay = (day: IsoWeekday) => {
    setCustomDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Give your habit a title.");
      return;
    }
    if (frequency === "custom" && customDays.length === 0) {
      setError("Pick at least one day for a custom schedule.");
      return;
    }

    let parsedTarget: number | null = null;
    if (targetValue.trim()) {
      const value = Number(targetValue);
      if (!Number.isFinite(value) || value <= 0) {
        setError("Target must be a positive number.");
        return;
      }
      parsedTarget = value;
    }
    if (reminderEnabled && !reminderTime) {
      setError("Choose a reminder time.");
      return;
    }

    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || null,
        category,
        icon,
        color,
        frequency,
        customDays: frequency === "custom" ? customDays : null,
        targetValue: parsedTarget,
        unit: unit.trim() || null,
        reminderEnabled,
        reminderTime: reminderEnabled ? reminderTime : null,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn’t save habit.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit Habit" : "New Habit"}</DialogTitle>
          <DialogDescription>
            Track a recurring routine and build your streak.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="habit-title">Title</Label>
            <Input
              id="habit-title"
              value={title}
              maxLength={100}
              placeholder="e.g. Read 10 pages"
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="habit-description">Description</Label>
            <Textarea
              id="habit-description"
              value={description}
              maxLength={1000}
              placeholder="Optional notes"
              onChange={(event) => setDescription(event.target.value)}
              disabled={saving}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as HabitCategory)} disabled={saving}>
                <SelectTrigger aria-label="Category" className="capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item} className="capitalize">
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(value) => setFrequency(value as HabitFrequency)} disabled={saving}>
                <SelectTrigger aria-label="Frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                  <SelectItem value="custom">Custom days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === "custom" && (
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => {
                const active = customDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    disabled={saving}
                    aria-pressed={active}
                    className={cn(
                      "h-9 w-11 rounded-lg text-xs font-semibold transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_ICON_NAMES.map((name) => {
                const IconComponent = getHabitIcon(name);
                const active = icon === name;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-label={name}
                    aria-pressed={active}
                    onClick={() => setIcon(name)}
                    disabled={saving}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <IconComponent size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((item) => {
                const active = color === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-label={item}
                    aria-pressed={active}
                    onClick={() => setColor(item)}
                    disabled={saving}
                    className={cn(
                      "h-7 w-7 rounded-full transition",
                      getHabitColorClasses(item).solid,
                      active ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-80 hover:opacity-100",
                    )}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="habit-target">Daily target</Label>
              <Input
                id="habit-target"
                type="number"
                min={0}
                step="any"
                value={targetValue}
                placeholder="Optional"
                onChange={(event) => setTargetValue(event.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-unit">Unit</Label>
              <Input
                id="habit-unit"
                value={unit}
                maxLength={30}
                placeholder="e.g. glasses"
                onChange={(event) => setUnit(event.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
            <div>
              <Label htmlFor="habit-reminder" className="cursor-pointer">Daily reminder</Label>
              <p className="text-xs text-muted-foreground">Get a nudge at a set time.</p>
            </div>
            <Switch
              id="habit-reminder"
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
              disabled={saving}
            />
          </div>
          {reminderEnabled && (
            <div className="space-y-2">
              <Label htmlFor="habit-reminder-time">Reminder time</Label>
              <Input
                id="habit-reminder-time"
                type="time"
                value={reminderTime}
                onChange={(event) => setReminderTime(event.target.value)}
                disabled={saving}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              {habit ? "Save changes" : "Create habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HabitFormDialog;
