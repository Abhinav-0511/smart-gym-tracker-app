import type { WorkoutPlanDay } from "@/types/workout-plan";

export interface WorkoutSessionSet {
  id: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  isCompleted: boolean;
  completedAt: string | null;
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
}

export interface StartWorkoutInput {
  userId: string;
  planDay: WorkoutPlanDay;
}
