import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import GlassCard from "@/components/GlassCard";

describe("GlassCard", () => {
  it("renders its content and preserves caller-provided attributes", () => {
    render(
      <GlassCard aria-label="Workout summary" className="custom-card">
        Legs day
      </GlassCard>,
    );

    const card = screen.getByLabelText("Workout summary");

    expect(card).toHaveTextContent("Legs day");
    expect(card).toHaveClass("glass-card", "custom-card");
  });

  it("adds interactive styling only when hover is enabled", () => {
    const { rerender } = render(<GlassCard>Static card</GlassCard>);

    expect(screen.getByText("Static card")).not.toHaveClass("cursor-pointer");

    rerender(<GlassCard hover>Interactive card</GlassCard>);

    expect(screen.getByText("Interactive card")).toHaveClass("cursor-pointer");
  });
});
