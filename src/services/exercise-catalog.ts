import { supabase } from "@/lib/supabase";
import type { ExerciseCatalogItem } from "@/types/workout-plan";

function mapCatalogItem(
  exercise: {
    id: string;
    name: string;
    category: string | null;
    equipment: string | null;
    uses_bodyweight: boolean;
  },
): ExerciseCatalogItem {
  return {
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    equipment: exercise.equipment,
    usesBodyweight: exercise.uses_bodyweight,
  };
}

export async function fetchExerciseCatalog(): Promise<ExerciseCatalogItem[]> {
  const { data, error } = await supabase
    .from("exercise_catalog")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapCatalogItem);
}

export async function createExerciseCatalogItem(
  name: string,
): Promise<ExerciseCatalogItem> {
  const { data, error } = await supabase
    .rpc("create_exercise_catalog_item", { p_name: name })
    .single();

  if (error) throw error;
  return mapCatalogItem(data);
}
