export interface Exercise {
  id: string;
  name: string;
  sets: SetData[];
  previousBest?: string;
}

export interface SetData {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutDay {
  day: string;
  shortDay: string;
  type: string;
  exercises: Exercise[];
  completed: boolean;
}

export interface PRRecord {
  id: string;
  exercise: string;
  weight: number;
  date: string;
  type: "auto" | "manual";
  previousWeight?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  date?: string;
}

export const weeklyPlan: WorkoutDay[] = [
  {
    day: "Monday", shortDay: "Mon", type: "Push", completed: true,
    exercises: [
      { id: "1", name: "Bench Press", sets: [{ setNumber: 1, reps: 8, weight: 80, completed: true }, { setNumber: 2, reps: 8, weight: 80, completed: true }, { setNumber: 3, reps: 6, weight: 85, completed: true }], previousBest: "82.5kg" },
      { id: "2", name: "Overhead Press", sets: [{ setNumber: 1, reps: 10, weight: 40, completed: true }, { setNumber: 2, reps: 10, weight: 40, completed: true }, { setNumber: 3, reps: 8, weight: 42.5, completed: true }], previousBest: "40kg" },
      { id: "3", name: "Incline Dumbbell Press", sets: [{ setNumber: 1, reps: 12, weight: 28, completed: true }, { setNumber: 2, reps: 10, weight: 30, completed: true }, { setNumber: 3, reps: 10, weight: 30, completed: true }] },
      { id: "4", name: "Lateral Raises", sets: [{ setNumber: 1, reps: 15, weight: 10, completed: true }, { setNumber: 2, reps: 15, weight: 10, completed: true }, { setNumber: 3, reps: 12, weight: 12, completed: true }] },
      { id: "5", name: "Tricep Pushdown", sets: [{ setNumber: 1, reps: 12, weight: 25, completed: true }, { setNumber: 2, reps: 12, weight: 25, completed: true }, { setNumber: 3, reps: 10, weight: 27.5, completed: true }] },
    ],
  },
  {
    day: "Tuesday", shortDay: "Tue", type: "Pull", completed: true,
    exercises: [
      { id: "6", name: "Deadlift", sets: [{ setNumber: 1, reps: 5, weight: 140, completed: true }, { setNumber: 2, reps: 5, weight: 140, completed: true }, { setNumber: 3, reps: 3, weight: 150, completed: true }], previousBest: "145kg" },
      { id: "7", name: "Barbell Row", sets: [{ setNumber: 1, reps: 8, weight: 70, completed: true }, { setNumber: 2, reps: 8, weight: 70, completed: true }, { setNumber: 3, reps: 6, weight: 75, completed: true }] },
      { id: "8", name: "Pull-ups", sets: [{ setNumber: 1, reps: 10, weight: 0, completed: true }, { setNumber: 2, reps: 8, weight: 0, completed: true }, { setNumber: 3, reps: 7, weight: 0, completed: true }] },
      { id: "9", name: "Face Pulls", sets: [{ setNumber: 1, reps: 15, weight: 15, completed: true }, { setNumber: 2, reps: 15, weight: 15, completed: true }, { setNumber: 3, reps: 15, weight: 15, completed: true }] },
      { id: "10", name: "Bicep Curls", sets: [{ setNumber: 1, reps: 12, weight: 14, completed: true }, { setNumber: 2, reps: 12, weight: 14, completed: true }, { setNumber: 3, reps: 10, weight: 16, completed: true }] },
    ],
  },
  {
    day: "Wednesday", shortDay: "Wed", type: "Legs", completed: false,
    exercises: [
      { id: "11", name: "Squat", sets: [{ setNumber: 1, reps: 8, weight: 100, completed: false }, { setNumber: 2, reps: 8, weight: 100, completed: false }, { setNumber: 3, reps: 6, weight: 110, completed: false }], previousBest: "105kg" },
      { id: "12", name: "Romanian Deadlift", sets: [{ setNumber: 1, reps: 10, weight: 80, completed: false }, { setNumber: 2, reps: 10, weight: 80, completed: false }, { setNumber: 3, reps: 8, weight: 85, completed: false }] },
      { id: "13", name: "Leg Press", sets: [{ setNumber: 1, reps: 12, weight: 180, completed: false }, { setNumber: 2, reps: 12, weight: 180, completed: false }, { setNumber: 3, reps: 10, weight: 200, completed: false }] },
      { id: "14", name: "Leg Curls", sets: [{ setNumber: 1, reps: 12, weight: 40, completed: false }, { setNumber: 2, reps: 12, weight: 40, completed: false }, { setNumber: 3, reps: 12, weight: 40, completed: false }] },
      { id: "15", name: "Calf Raises", sets: [{ setNumber: 1, reps: 15, weight: 60, completed: false }, { setNumber: 2, reps: 15, weight: 60, completed: false }, { setNumber: 3, reps: 15, weight: 60, completed: false }] },
    ],
  },
  {
    day: "Thursday", shortDay: "Thu", type: "Push", completed: false,
    exercises: [
      { id: "16", name: "Incline Bench Press", sets: [{ setNumber: 1, reps: 8, weight: 65, completed: false }, { setNumber: 2, reps: 8, weight: 65, completed: false }, { setNumber: 3, reps: 6, weight: 70, completed: false }] },
      { id: "17", name: "Dumbbell Shoulder Press", sets: [{ setNumber: 1, reps: 10, weight: 22, completed: false }, { setNumber: 2, reps: 10, weight: 22, completed: false }, { setNumber: 3, reps: 8, weight: 24, completed: false }] },
      { id: "18", name: "Cable Flyes", sets: [{ setNumber: 1, reps: 12, weight: 15, completed: false }, { setNumber: 2, reps: 12, weight: 15, completed: false }, { setNumber: 3, reps: 12, weight: 15, completed: false }] },
    ],
  },
  {
    day: "Friday", shortDay: "Fri", type: "Pull", completed: false,
    exercises: [
      { id: "19", name: "Weighted Pull-ups", sets: [{ setNumber: 1, reps: 6, weight: 10, completed: false }, { setNumber: 2, reps: 6, weight: 10, completed: false }, { setNumber: 3, reps: 5, weight: 12.5, completed: false }] },
      { id: "20", name: "Cable Row", sets: [{ setNumber: 1, reps: 10, weight: 60, completed: false }, { setNumber: 2, reps: 10, weight: 60, completed: false }, { setNumber: 3, reps: 8, weight: 65, completed: false }] },
      { id: "21", name: "Hammer Curls", sets: [{ setNumber: 1, reps: 12, weight: 16, completed: false }, { setNumber: 2, reps: 12, weight: 16, completed: false }, { setNumber: 3, reps: 10, weight: 18, completed: false }] },
    ],
  },
  {
    day: "Saturday", shortDay: "Sat", type: "Legs", completed: false,
    exercises: [
      { id: "22", name: "Front Squat", sets: [{ setNumber: 1, reps: 8, weight: 70, completed: false }, { setNumber: 2, reps: 8, weight: 70, completed: false }, { setNumber: 3, reps: 6, weight: 75, completed: false }] },
      { id: "23", name: "Bulgarian Split Squat", sets: [{ setNumber: 1, reps: 10, weight: 20, completed: false }, { setNumber: 2, reps: 10, weight: 20, completed: false }, { setNumber: 3, reps: 10, weight: 20, completed: false }] },
      { id: "24", name: "Leg Extension", sets: [{ setNumber: 1, reps: 12, weight: 50, completed: false }, { setNumber: 2, reps: 12, weight: 50, completed: false }, { setNumber: 3, reps: 12, weight: 50, completed: false }] },
    ],
  },
  {
    day: "Sunday", shortDay: "Sun", type: "Rest", completed: false, exercises: [],
  },
];

export const prRecords: PRRecord[] = [
  { id: "1", exercise: "Bench Press", weight: 100, date: "2024-03-10", type: "auto", previousWeight: 95 },
  { id: "2", exercise: "Squat", weight: 140, date: "2024-03-08", type: "auto", previousWeight: 135 },
  { id: "3", exercise: "Deadlift", weight: 180, date: "2024-03-05", type: "auto", previousWeight: 175 },
  { id: "4", exercise: "Overhead Press", weight: 60, date: "2024-02-28", type: "manual", previousWeight: 57.5 },
  { id: "5", exercise: "Barbell Row", weight: 90, date: "2024-02-25", type: "auto", previousWeight: 85 },
  { id: "6", exercise: "Pull-ups", weight: 15, date: "2024-02-20", type: "auto", previousWeight: 12.5 },
];

export const achievements: Achievement[] = [
  { id: "1", title: "First Workout", description: "Complete your first workout", icon: "🏋️", unlocked: true, date: "2024-01-15" },
  { id: "2", title: "Week Warrior", description: "Train 7 days in a row", icon: "🔥", unlocked: true, date: "2024-02-01" },
  { id: "3", title: "PR Crusher", description: "Set 5 personal records", icon: "🏆", unlocked: true, date: "2024-02-15" },
  { id: "4", title: "Centurion", description: "Bench press 100kg", icon: "💪", unlocked: true, date: "2024-03-10" },
  { id: "5", title: "Iron Will", description: "30-day streak", icon: "⚡", unlocked: false },
  { id: "6", title: "Beast Mode", description: "Complete 100 workouts", icon: "🦁", unlocked: false },
];

export const progressData = {
  weight: [
    { week: "W1", weight: 82 }, { week: "W2", weight: 81.5 }, { week: "W3", weight: 81.2 },
    { week: "W4", weight: 80.8 }, { week: "W5", weight: 80.5 }, { week: "W6", weight: 80.1 },
    { week: "W7", weight: 79.8 }, { week: "W8", weight: 79.5 },
  ],
  strength: [
    { week: "W1", bench: 85, squat: 120, deadlift: 160 },
    { week: "W2", bench: 87.5, squat: 122.5, deadlift: 162.5 },
    { week: "W3", bench: 87.5, squat: 125, deadlift: 165 },
    { week: "W4", bench: 90, squat: 127.5, deadlift: 167.5 },
    { week: "W5", bench: 92.5, squat: 130, deadlift: 170 },
    { week: "W6", bench: 95, squat: 132.5, deadlift: 172.5 },
    { week: "W7", bench: 97.5, squat: 135, deadlift: 175 },
    { week: "W8", bench: 100, squat: 140, deadlift: 180 },
  ],
  consistency: [
    { week: "W1", workouts: 5 }, { week: "W2", workouts: 6 }, { week: "W3", workouts: 5 },
    { week: "W4", workouts: 6 }, { week: "W5", workouts: 4 }, { week: "W6", workouts: 6 },
    { week: "W7", workouts: 5 }, { week: "W8", workouts: 5 },
  ],
};

export const userProfile = {
  name: "Alex Johnson",
  email: "alex@example.com",
  avatar: "AJ",
  memberSince: "January 2024",
  goal: "Build Muscle",
  experience: "Intermediate",
  weight: 79.5,
  height: 178,
  streak: 12,
  totalWorkouts: 47,
  totalPRs: 6,
};
