import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ExercisePicker from "@/components/exercises/ExercisePicker";
import {
  filterExerciseCatalog,
  normalizeExerciseName,
} from "@/lib/exercise-search";
import type { ExerciseCatalogItem } from "@/types/workout-plan";

const catalog: ExerciseCatalogItem[] = [
  {
    id: "bench",
    name: "Bench Press",
    category: "push",
    equipment: "barbell",
    usesBodyweight: false,
  },
  {
    id: "row",
    name: "Barbell Row",
    category: "pull",
    equipment: "barbell",
    usesBodyweight: false,
  },
  {
    id: "overhead",
    name: "Overhead Press",
    category: "push",
    equipment: "barbell",
    usesBodyweight: false,
  },
  {
    id: "shoulder",
    name: "Dumbbell Shoulder Press",
    category: "push",
    equipment: "dumbbells",
    usesBodyweight: false,
  },
];

describe("ExercisePicker", () => {
  it("normalizes names and searches any part of a name", () => {
    expect(normalizeExerciseName("  BENCH   Press ")).toBe("bench press");
    expect(
      filterExerciseCatalog(catalog, " press ").map((exercise) => exercise.name),
    ).toEqual([
      "Bench Press",
      "Overhead Press",
      "Dumbbell Shoulder Press",
    ]);
  });

  it("autofocuses search and supports mouse selection", async () => {
    const onSelect = vi.fn();
    render(<ExercisePicker exercises={catalog} onSelect={onSelect} />);

    const input = screen.getByRole("combobox", { name: "Search exercises" });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "overhead" } });
    fireEvent.click(screen.getByText("Overhead Press"));

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(catalog[2]));
  });

  it("supports Arrow keys and Enter", async () => {
    const onSelect = vi.fn();
    render(<ExercisePicker exercises={catalog} onSelect={onSelect} />);

    const input = screen.getByRole("combobox", { name: "Search exercises" });
    fireEvent.change(input, { target: { value: "bench" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(catalog[0]));
  });

  it("creates a missing exercise and immediately selects it", async () => {
    const created: ExerciseCatalogItem = {
      id: "machine-press",
      name: "Machine Chest Press",
      category: "other",
      equipment: null,
      usesBodyweight: false,
    };
    const onCreate = vi.fn().mockResolvedValue(created);
    const onSelect = vi.fn();
    render(
      <ExercisePicker
        exercises={catalog}
        onCreate={onCreate}
        onSelect={onSelect}
      />,
    );

    fireEvent.change(
      screen.getByRole("combobox", { name: "Search exercises" }),
      { target: { value: "  Machine   Chest Press  " } },
    );
    expect(screen.getByText("No exercise found.")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Create “Machine Chest Press”/));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith("Machine Chest Press");
      expect(onSelect).toHaveBeenCalledWith(created);
    });
  });
});
