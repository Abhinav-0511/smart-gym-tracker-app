import type { ExerciseCatalogItem } from "@/types/workout-plan";

export function normalizeExerciseName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function filterExerciseCatalog(
  catalog: ExerciseCatalogItem[],
  query: string,
): ExerciseCatalogItem[] {
  const normalizedQuery = normalizeExerciseName(query);
  if (!normalizedQuery) return catalog;

  return catalog.filter((exercise) =>
    normalizeExerciseName(exercise.name).includes(normalizedQuery),
  );
}
