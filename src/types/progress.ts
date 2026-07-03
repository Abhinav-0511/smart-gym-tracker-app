export interface ProgressSet {
  exerciseId: string;
  exerciseName: string;
  reps: number;
  weightKg: number;
}

export interface ProgressWorkout {
  id: string;
  workoutDate: string;
  startedAt: string | null;
  completedAt: string | null;
  sets: ProgressSet[];
}

export interface BodyWeightPoint {
  date: string;
  weight: number;
}

export interface PeriodValue {
  period: string;
  label: string;
  value: number;
}

export interface ExerciseProgression {
  exerciseId: string;
  exerciseName: string;
  points: PeriodValue[];
}

export interface ProgressData {
  bodyWeight: BodyWeightPoint[];
  exerciseProgressions: ExerciseProgression[];
  weeklyFrequency: PeriodValue[];
  monthlyFrequency: PeriodValue[];
  weeklyVolume: PeriodValue[];
  weeklyDuration: PeriodValue[];
  averageWorkoutDurationMinutes: number | null;
  consistencyPercent: number;
  bodyWeightChangeKg: number | null;
  volumeTrendPercent: number | null;
  workoutTrendPercent: number | null;
}

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function addDays(date: string, days: number): string {
  const value = parseDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function getWeekStart(date: string): string {
  const value = parseDate(date);
  const offset = (value.getUTCDay() + 6) % 7;
  return addDays(date, -offset);
}

function getMonthKey(date: string): string {
  return date.slice(0, 7);
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function recentWeekStarts(nowDate: string, count: number): string[] {
  const currentWeek = getWeekStart(nowDate);
  return Array.from({ length: count }, (_, index) =>
    addDays(currentWeek, (index - count + 1) * 7),
  );
}

function recentMonths(nowDate: string, count: number): string[] {
  const current = parseDate(`${nowDate.slice(0, 7)}-01`);
  return Array.from({ length: count }, (_, index) => {
    const value = new Date(current);
    value.setUTCMonth(value.getUTCMonth() + index - count + 1);
    return value.toISOString().slice(0, 7);
  });
}

function weekLabel(weekStart: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parseDate(weekStart));
}

function monthLabel(month: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(parseDate(`${month}-01`));
}

export function calculateProgressData(
  workouts: ProgressWorkout[],
  bodyWeightEntries: BodyWeightPoint[],
  nowDate: string,
): ProgressData {
  const weeks = recentWeekStarts(nowDate, 8);
  const months = recentMonths(nowDate, 6);
  const workoutsByWeek = new Map<string, ProgressWorkout[]>();
  const workoutsByMonth = new Map<string, ProgressWorkout[]>();

  for (const workout of workouts) {
    const week = getWeekStart(workout.workoutDate);
    const weekly = workoutsByWeek.get(week) ?? [];
    weekly.push(workout);
    workoutsByWeek.set(week, weekly);

    const month = getMonthKey(workout.workoutDate);
    const monthly = workoutsByMonth.get(month) ?? [];
    monthly.push(workout);
    workoutsByMonth.set(month, monthly);
  }

  const weeklyFrequency = weeks.map((period) => ({
    period,
    label: weekLabel(period),
    value: workoutsByWeek.get(period)?.length ?? 0,
  }));
  const monthlyFrequency = months.map((period) => ({
    period,
    label: monthLabel(period),
    value: workoutsByMonth.get(period)?.length ?? 0,
  }));
  const weeklyVolume = weeks.map((period) => ({
    period,
    label: weekLabel(period),
    value: Math.round(
      (workoutsByWeek.get(period) ?? []).reduce(
        (workoutTotal, workout) =>
          workoutTotal
          + workout.sets.reduce(
            (setTotal, set) => setTotal + set.reps * set.weightKg,
            0,
          ),
        0,
      ),
    ),
  }));
  const weeklyDuration = weeks.map((period) => {
    const durations = (workoutsByWeek.get(period) ?? []).flatMap((workout) =>
      workout.startedAt && workout.completedAt
        ? [Math.max(
            0,
            (new Date(workout.completedAt).getTime()
              - new Date(workout.startedAt).getTime())
              / 60_000,
          )]
        : [],
    );

    return {
      period,
      label: weekLabel(period),
      value: durations.length
        ? Math.round(
            durations.reduce((total, duration) => total + duration, 0)
              / durations.length,
          )
        : 0,
    };
  });

  const exerciseWeeks = new Map<
    string,
    { name: string; weights: Map<string, number> }
  >();
  for (const workout of workouts) {
    const week = getWeekStart(workout.workoutDate);
    for (const set of workout.sets) {
      const exercise = exerciseWeeks.get(set.exerciseId) ?? {
        name: set.exerciseName,
        weights: new Map<string, number>(),
      };
      exercise.weights.set(
        week,
        Math.max(exercise.weights.get(week) ?? -Infinity, set.weightKg),
      );
      exerciseWeeks.set(set.exerciseId, exercise);
    }
  }

  const exerciseProgressions = Array.from(exerciseWeeks.entries())
    .map(([exerciseId, exercise]) => ({
      exerciseId,
      exerciseName: exercise.name,
      points: weeks.flatMap((period) => {
        const value = exercise.weights.get(period);
        return value === undefined
          ? []
          : [{ period, label: weekLabel(period), value }];
      }),
    }))
    .filter((exercise) => exercise.points.length > 0)
    .sort((left, right) => left.exerciseName.localeCompare(right.exerciseName));

  const durations = workouts.flatMap((workout) =>
    workout.startedAt && workout.completedAt
      ? [
          Math.max(
            0,
            (new Date(workout.completedAt).getTime()
              - new Date(workout.startedAt).getTime())
              / 60_000,
          ),
        ]
      : [],
  );
  const sortedWeights = [...bodyWeightEntries].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const latestWeekly = weeklyFrequency.at(-1)?.value ?? 0;
  const previousWeekly = weeklyFrequency.at(-2)?.value ?? 0;
  const latestVolume = weeklyVolume.at(-1)?.value ?? 0;
  const previousVolume = weeklyVolume.at(-2)?.value ?? 0;

  return {
    bodyWeight: sortedWeights,
    exerciseProgressions,
    weeklyFrequency,
    monthlyFrequency,
    weeklyVolume,
    weeklyDuration,
    averageWorkoutDurationMinutes: durations.length
      ? Math.round(
          durations.reduce((total, duration) => total + duration, 0)
            / durations.length,
        )
      : null,
    consistencyPercent: Math.round(
      (weeklyFrequency.filter((week) => week.value > 0).length / weeks.length)
        * 100,
    ),
    bodyWeightChangeKg:
      sortedWeights.length > 1
        ? Number(
            (
              sortedWeights.at(-1)!.weight - sortedWeights[0].weight
            ).toFixed(2),
          )
        : null,
    volumeTrendPercent: percentChange(latestVolume, previousVolume),
    workoutTrendPercent: percentChange(latestWeekly, previousWeekly),
  };
}
