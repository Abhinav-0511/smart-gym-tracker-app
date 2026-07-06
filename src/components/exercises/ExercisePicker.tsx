import { useMemo, useState } from "react";
import { Dumbbell, LoaderCircle, Plus } from "lucide-react";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  filterExerciseCatalog,
  normalizeExerciseName,
} from "@/lib/exercise-search";
import type { ExerciseCatalogItem } from "@/types/workout-plan";

export interface ExercisePickerProps {
  exercises: ExerciseCatalogItem[];
  excludedExerciseIds?: readonly string[];
  busy?: boolean;
  placeholder?: string;
  onSelect: (exercise: ExerciseCatalogItem) => Promise<void> | void;
  onCreate?: (name: string) => Promise<ExerciseCatalogItem>;
}

const ExercisePicker = ({
  exercises,
  excludedExerciseIds = [],
  busy = false,
  placeholder = "Search exercises…",
  onSelect,
  onCreate,
}: ExercisePickerProps) => {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const excludedIds = useMemo(
    () => new Set(excludedExerciseIds),
    [excludedExerciseIds],
  );
  const matches = useMemo(
    () => filterExerciseCatalog(exercises, query),
    [exercises, query],
  );
  const normalizedQuery = normalizeExerciseName(query);
  const exactMatch = exercises.find(
    (exercise) => normalizeExerciseName(exercise.name) === normalizedQuery,
  );
  const canCreate =
    Boolean(onCreate)
    && Boolean(normalizedQuery)
    && matches.length === 0
    && !exactMatch;

  const selectExercise = async (exercise: ExerciseCatalogItem) => {
    if (busy || creating || excludedIds.has(exercise.id)) return;
    setError(null);

    try {
      await onSelect(exercise);
    } catch (selectionError) {
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : "Couldn’t select exercise.",
      );
    }
  };

  const createExercise = async () => {
    if (!onCreate || !canCreate || creating || busy) return;
    setCreating(true);
    setError(null);

    try {
      const createdExercise = await onCreate(
        query.trim().replace(/\s+/g, " "),
      );
      await onSelect(createdExercise);
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : "Couldn’t create exercise.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-popover">
      <Command shouldFilter={false} loop label="Search exercises">
        <CommandInput
          autoFocus
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            setError(null);
          }}
          placeholder={placeholder}
          disabled={busy || creating}
          aria-label="Search exercises"
        />
        <CommandList className="max-h-72">
          {matches.length > 0 ? (
            <CommandGroup heading="Exercises">
              {matches.map((exercise) => {
                const excluded = excludedIds.has(exercise.id);
                return (
                  <CommandItem
                    key={exercise.id}
                    value={exercise.id}
                    disabled={excluded || busy || creating}
                    onSelect={() => void selectExercise(exercise)}
                    className="min-h-11 gap-3 py-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Dumbbell size={15} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {exercise.name}
                      </span>
                      <span className="block text-xs capitalize text-muted-foreground">
                        {[exercise.category, exercise.equipment]
                          .filter(Boolean)
                          .join(" · ") || "Custom exercise"}
                      </span>
                    </span>
                    {excluded && (
                      <span className="text-xs text-muted-foreground">
                        Already added
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : (
            <div className="px-3 py-5 text-center">
              <p className="text-sm text-muted-foreground">
                {normalizedQuery
                  ? "No exercise found."
                  : "Start typing to find or create an exercise."}
              </p>
            </div>
          )}

          {canCreate && (
            <CommandGroup heading="Create">
              <CommandItem
                value={`create-${normalizedQuery}`}
                disabled={busy || creating}
                onSelect={() => void createExercise()}
                className="gap-3 py-3"
              >
                {creating ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                <span>Create “{query.trim().replace(/\s+/g, " ")}”</span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </Command>
      {error && (
        <p
          className="border-t border-border px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default ExercisePicker;
