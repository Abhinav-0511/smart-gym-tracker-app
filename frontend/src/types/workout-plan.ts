export interface ExerciseCatalogItem {
  id: string;
  name: string;
  category: string | null;
  equipment: string | null;
  usesBodyweight: boolean;
}

export interface PlannedSet {
  id: string;
  setNumber: number;
  targetReps: number;
  targetWeightKg: number | null;
}

export interface PlannedExercise {
  id: string;
  exerciseId: string;
  name: string;
  position: number;
  usesBodyweight: boolean;
  sets: PlannedSet[];
}

export interface WorkoutPlanDay {
  id: string;
  dayOfWeek: number;
  workoutType: string;
  isRestDay: boolean;
  exercises: PlannedExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  isActive: boolean;
  days: WorkoutPlanDay[];
}

export interface PlannedSetUpdate {
  targetReps?: number;
  targetWeightKg?: number | null;
}

export const WEEKDAYS = [
  { day: "Monday", shortDay: "Mon" },
  { day: "Tuesday", shortDay: "Tue" },
  { day: "Wednesday", shortDay: "Wed" },
  { day: "Thursday", shortDay: "Thu" },
  { day: "Friday", shortDay: "Fri" },
  { day: "Saturday", shortDay: "Sat" },
  { day: "Sunday", shortDay: "Sun" },
] as const;

export function getWeekday(dayOfWeek: number) {
  return WEEKDAYS[dayOfWeek - 1] ?? {
    day: `Day ${dayOfWeek}`,
    shortDay: `${dayOfWeek}`,
  };
}
