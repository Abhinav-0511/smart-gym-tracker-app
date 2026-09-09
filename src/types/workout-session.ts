import type { WorkoutPlanDay } from "@/types/workout-plan";

/** Reps In Reserve: how many more reps the set had left in the tank. 4 stands for "4+". */
export type Rir = 0 | 1 | 2 | 3 | 4;

export type SetType = "warmup" | "working";

export interface WorkoutSessionSet {
  id: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  isCompleted: boolean;
  completedAt: string | null;
  rir: Rir | null;
  setType: SetType;
}

export interface WorkoutSessionExercise {
  id: string;
  exerciseId: string;
  name: string;
  position: number;
  usesBodyweight: boolean;
  sets: WorkoutSessionSet[];
}

export interface WorkoutSession {
  id: string;
  title: string;
  status: "in_progress" | "completed" | "cancelled";
  workoutDate: string;
  workoutPlanDayId: string | null;
  notes: string;
  startedAt: string;
  completedAt: string | null;
  exercises: WorkoutSessionExercise[];
}

export interface WorkoutSetUpdate {
  reps?: number | null;
  weightKg?: number | null;
  isCompleted?: boolean;
  rir?: Rir | null;
  setType?: SetType;
}

export interface StartWorkoutInput {
  userId: string;
  planDay: WorkoutPlanDay;
  workoutDate: string;
}
