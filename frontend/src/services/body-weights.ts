import { supabase } from "@/lib/supabase";

export interface BodyWeightEntry {
  recordedOn: string;
  weightKg: number;
}

export async function fetchCurrentBodyWeight(
  userId: string,
): Promise<BodyWeightEntry | null> {
  const { data, error } = await supabase
    .from("body_weight_entries")
    .select("recorded_on, weight_kg")
    .eq("user_id", userId)
    .order("recorded_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data
    ? {
        recordedOn: data.recorded_on,
        weightKg: Number(data.weight_kg),
      }
    : null;
}

export async function upsertCurrentBodyWeight(
  userId: string,
  entry: BodyWeightEntry,
): Promise<BodyWeightEntry> {
  const { data, error } = await supabase
    .from("body_weight_entries")
    .upsert(
      {
        user_id: userId,
        recorded_on: entry.recordedOn,
        weight_kg: entry.weightKg,
      },
      { onConflict: "user_id,recorded_on" },
    )
    .select("recorded_on, weight_kg")
    .single();

  if (error) throw error;

  return {
    recordedOn: data.recorded_on,
    weightKg: Number(data.weight_kg),
  };
}
