export interface CompletedWorkoutRow {
  id: string;
  title: string;
  workoutDate: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface WeeklyConsistencyDay {
  date: string;
  dayOfWeek: number;
  shortDay: string;
  completed: boolean;
}

export interface LastWorkoutSummary {
  id: string;
  title: string;
  workoutDate: string;
  durationMinutes: number | null;
}

export interface DashboardWorkoutAggregate {
  totalCompletedWorkouts: number;
  totalPRCount: number;
  currentStreak: number;
  longestStreak: number;
  weeklyCompletedDays: number;
  weeklyDays: WeeklyConsistencyDay[];
  lastWorkout: LastWorkoutSummary | null;
}

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function dateDifferenceInDays(left: string, right: string): number {
  return Math.round(
    (parseDate(left).getTime() - parseDate(right).getTime()) / 86_400_000,
  );
}

function addDays(date: string, days: number): string {
  const value = parseDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function getLocalDateString(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getGreeting(date: Date, timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function calculateDashboardWorkoutAggregate(
  rows: CompletedWorkoutRow[],
  totalCompletedWorkouts: number,
  timezone: string,
  now = new Date(),
  totalPRCount = 0,
): DashboardWorkoutAggregate {
  const today = getLocalDateString(now, timezone);
  const uniqueDates = Array.from(new Set(rows.map((row) => row.workoutDate))).sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate: string | null = null;

  for (const date of uniqueDates) {
    runningStreak =
      previousDate && dateDifferenceInDays(date, previousDate) === 1
        ? runningStreak + 1
        : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
    previousDate = date;
  }

  const latestDate = uniqueDates.at(-1);
  let currentStreak = 0;
  if (
    latestDate
    && [0, 1].includes(dateDifferenceInDays(today, latestDate))
  ) {
    currentStreak = 1;
    for (let index = uniqueDates.length - 1; index > 0; index -= 1) {
      if (dateDifferenceInDays(uniqueDates[index], uniqueDates[index - 1]) !== 1) {
        break;
      }
      currentStreak += 1;
    }
  }

  const todayValue = parseDate(today);
  const mondayOffset = (todayValue.getUTCDay() + 6) % 7;
  const monday = addDays(today, -mondayOffset);
  const completedDateSet = new Set(uniqueDates);
  const shortDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyDays = shortDays.map((shortDay, index) => {
    const date = addDays(monday, index);
    return {
      date,
      dayOfWeek: index + 1,
      shortDay,
      completed: completedDateSet.has(date),
    };
  });

  const latestWorkout = [...rows].sort(
    (left, right) =>
      right.workoutDate.localeCompare(left.workoutDate)
      || (right.completedAt ?? "").localeCompare(left.completedAt ?? ""),
  )[0];
  const durationMinutes =
    latestWorkout?.startedAt && latestWorkout.completedAt
      ? Math.max(
          0,
          Math.round(
            (new Date(latestWorkout.completedAt).getTime()
              - new Date(latestWorkout.startedAt).getTime())
              / 60_000,
          ),
        )
      : null;

  return {
    totalCompletedWorkouts,
    totalPRCount,
    currentStreak,
    longestStreak,
    weeklyCompletedDays: weeklyDays.filter((day) => day.completed).length,
    weeklyDays,
    lastWorkout: latestWorkout
      ? {
          id: latestWorkout.id,
          title: latestWorkout.title,
          workoutDate: latestWorkout.workoutDate,
          durationMinutes,
        }
      : null,
  };
}
