import { supabase } from "@/lib/supabase";
import type { LocalRow } from "@/offline/db";
import { deterministicId } from "@/offline/ids";
import { localInsert, localRowsByUser, pullMirror } from "@/offline/repository";
import {
  DEFAULT_FITNESS_TARGETS,
  type FitnessTargets,
  type FitnessTargetsInput,
} from "@/types/checkin";

function throwIfError(error: { message: string } | null): void {
  if (error) throw error;
}

function mapTargets(row: LocalRow): FitnessTargets {
  return {
    proteinTargetG: Number(row.protein_target_g) || DEFAULT_FITNESS_TARGETS.proteinTargetG,
    stepsTarget: Number(row.steps_target) || DEFAULT_FITNESS_TARGETS.stepsTarget,
    sleepTargetHours: Number(row.sleep_target_hours) || DEFAULT_FITNESS_TARGETS.sleepTargetHours,
    calorieTarget: (row.calorie_target as number | null) ?? null,
    waterTargetLiters: (row.water_target_liters as number | null) ?? null,
  };
}

/** One row per user — deterministic id keeps saves idempotent across devices. */
function targetsId(userId: string): string {
  return deterministicId(`fitness_targets:${userId}`);
}

async function fetchServerTargetsRows(userId: string): Promise<LocalRow[]> {
  const { data, error } = await supabase
    .from("fitness_targets")
    .select("*")
    .eq("user_id", userId)
    .limit(1);
  throwIfError(error);
  return (data ?? []) as unknown as LocalRow[];
}

/** Defaults are applied client-side when the user has never saved targets — no row is created until they do. */
export async function fetchFitnessTargets(userId: string): Promise<FitnessTargets> {
  await pullMirror("fitness_targets", () => fetchServerTargetsRows(userId));
  const rows = await localRowsByUser("fitness_targets", userId);
  return rows[0] ? mapTargets(rows[0]) : DEFAULT_FITNESS_TARGETS;
}

export async function saveFitnessTargets(
  userId: string,
  input: FitnessTargetsInput,
): Promise<FitnessTargets> {
  const current = await fetchFitnessTargets(userId);
  const row = await localInsert(
    "fitness_targets",
    {
      id: targetsId(userId),
      user_id: userId,
      protein_target_g: input.proteinTargetG ?? current.proteinTargetG,
      steps_target: input.stepsTarget ?? current.stepsTarget,
      sleep_target_hours: input.sleepTargetHours ?? current.sleepTargetHours,
      calorie_target:
        input.calorieTarget === undefined ? current.calorieTarget : input.calorieTarget,
      water_target_liters:
        input.waterTargetLiters === undefined
          ? current.waterTargetLiters
          : input.waterTargetLiters,
    },
    userId,
  );
  return mapTargets(row);
}
