import { supabase } from "@/lib/supabase";
import type { LocalRow } from "@/offline/db";
import { deterministicId } from "@/offline/ids";
import { localInsert, localRowsByUser, pullMirror } from "@/offline/repository";
import type { CheckinInput, DailyCheckin } from "@/types/checkin";

/** How many past check-ins the app keeps cached/considers "recent". */
const RECENT_CHECKIN_LIMIT = 120;

function throwIfError(error: { message: string } | null): void {
  if (error) throw error;
}

function mapCheckin(row: LocalRow): DailyCheckin {
  return {
    id: row.id,
    checkinDate: row.checkin_date as string,
    weightKg: (row.weight_kg as number | null) ?? null,
    waistCm: (row.waist_cm as number | null) ?? null,
    sleepHours: (row.sleep_hours as number | null) ?? null,
    steps: (row.steps as number | null) ?? null,
    calories: (row.calories as number | null) ?? null,
    proteinG: (row.protein_g as number | null) ?? null,
    waterLiters: (row.water_liters as number | null) ?? null,
    energy: (row.energy as number | null) ?? null,
    mood: (row.mood as number | null) ?? null,
    notes: (row.notes as string | null) ?? null,
  };
}

/**
 * A check-in's identity is its (user_id, checkin_date) — deriving the id from
 * that pair (same scheme as habit completions) makes re-saving the same date
 * an idempotent upsert instead of hitting the unique constraint as an error.
 */
function checkinId(userId: string, date: string): string {
  return deterministicId(`daily_checkin:${userId}:${date}`);
}

async function fetchServerCheckinRows(userId: string): Promise<LocalRow[]> {
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", userId)
    .order("checkin_date", { ascending: false })
    .limit(RECENT_CHECKIN_LIMIT);
  throwIfError(error);
  return (data ?? []) as unknown as LocalRow[];
}

export async function fetchRecentCheckins(userId: string): Promise<DailyCheckin[]> {
  await pullMirror("daily_checkins", () => fetchServerCheckinRows(userId));
  const rows = await localRowsByUser("daily_checkins", userId);
  return rows
    .map(mapCheckin)
    .sort((a, b) => b.checkinDate.localeCompare(a.checkinDate))
    .slice(0, RECENT_CHECKIN_LIMIT);
}

export async function saveCheckin(
  userId: string,
  input: CheckinInput,
): Promise<DailyCheckin> {
  const row = await localInsert(
    "daily_checkins",
    {
      id: checkinId(userId, input.checkinDate),
      user_id: userId,
      checkin_date: input.checkinDate,
      weight_kg: input.weightKg ?? null,
      waist_cm: input.waistCm ?? null,
      sleep_hours: input.sleepHours ?? null,
      steps: input.steps ?? null,
      calories: input.calories ?? null,
      protein_g: input.proteinG ?? null,
      water_liters: input.waterLiters ?? null,
      energy: input.energy ?? null,
      mood: input.mood ?? null,
      notes: input.notes?.trim() || null,
    },
    userId,
  );
  return mapCheckin(row);
}
