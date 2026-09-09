export interface DailyCheckin {
  id: string;
  checkinDate: string;
  weightKg: number | null;
  waistCm: number | null;
  sleepHours: number | null;
  steps: number | null;
  calories: number | null;
  proteinG: number | null;
  waterLiters: number | null;
  energy: number | null;
  mood: number | null;
  notes: string | null;
}

/** Only the date is required — every other field is an optional quick log. */
export interface CheckinInput {
  checkinDate: string;
  weightKg?: number | null;
  waistCm?: number | null;
  sleepHours?: number | null;
  steps?: number | null;
  calories?: number | null;
  proteinG?: number | null;
  waterLiters?: number | null;
  energy?: number | null;
  mood?: number | null;
  notes?: string | null;
}

export interface FitnessTargets {
  proteinTargetG: number;
  stepsTarget: number;
  sleepTargetHours: number;
  calorieTarget: number | null;
  waterTargetLiters: number | null;
}

export const DEFAULT_FITNESS_TARGETS: FitnessTargets = {
  proteinTargetG: 145,
  stepsTarget: 8000,
  sleepTargetHours: 8,
  calorieTarget: null,
  waterTargetLiters: null,
};

export interface FitnessTargetsInput {
  proteinTargetG?: number;
  stepsTarget?: number;
  sleepTargetHours?: number;
  calorieTarget?: number | null;
  waterTargetLiters?: number | null;
}
