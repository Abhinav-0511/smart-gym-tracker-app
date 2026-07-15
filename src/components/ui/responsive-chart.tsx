import { type ComponentProps } from "react";
import { ResponsiveContainer } from "recharts";

/**
 * Drop-in replacement for Recharts' {@link ResponsiveContainer} that suppresses
 * its first-paint dev warning:
 *
 *   "The width(-1) and height(-1) of chart should be greater than 0 …"
 *
 * Recharts seeds the container's size with `{ width: -1, height: -1 }` and
 * renders one frame at that size before its ResizeObserver measures the real
 * box. With a percentage width/height, that first frame resolves to -1/-1 and
 * Recharts warns (it only warns when *both* dimensions are <= 0).
 *
 * Seeding `initialDimension` with a single positive value satisfies the warn
 * check without changing behavior: the chart's children still don't render
 * until both dimensions are positive (Recharts requires width AND height > 0),
 * so with width seeded at 0 the actual chart still waits for the true measured
 * size. The ResizeObserver corrects both dimensions before paint, so there is
 * no visible flash and responsiveness is unchanged.
 */
export const ResponsiveChart = (
  props: ComponentProps<typeof ResponsiveContainer>,
) => (
  <ResponsiveContainer
    width="100%"
    height="100%"
    initialDimension={{ width: 0, height: 1 }}
    {...props}
  />
);
