import { supabase } from "@/lib/supabase";
import {
  calculateDashboardWorkoutAggregate,
  type CompletedWorkoutRow,
  type DashboardWorkoutAggregate,
} from "@/types/dashboard";

export async function fetchDashboardWorkoutAggregate(
  userId: string,
  timezone: string,
): Promise<DashboardWorkoutAggregate> {
  const [rowsResult, countResult, prCountResult] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, title, workout_date, started_at, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("workout_date", { ascending: false })
      .limit(1000),
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("personal_records")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (rowsResult.error) throw rowsResult.error;
  if (countResult.error) throw countResult.error;
  if (prCountResult.error) throw prCountResult.error;

  const rows: CompletedWorkoutRow[] = (rowsResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    workoutDate: row.workout_date,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }));

  return calculateDashboardWorkoutAggregate(
    rows,
    countResult.count ?? rows.length,
    timezone,
    new Date(),
    prCountResult.count ?? 0,
  );
}
