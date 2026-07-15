import { cn } from "@/lib/utils";
import { BRAND, BRAND_LOGOS, type BrandLogoKind } from "@/lib/brand";

interface BrandLogoProps {
  /**
   * Which mark to render:
   * - `app` — square icon mark (default): sidebar, splash, loaders, error states
   * - `full` — horizontal lockup: login, splash, about
   * - `fitness` / `productivity` / `finance` — per-module marks
   */
  kind?: BrandLogoKind;
  className?: string;
  /** Overrides the default, brand-derived alt text. */
  alt?: string;
}

const ALT_TEXT: Record<BrandLogoKind, string> = {
  app: BRAND.name,
  full: `${BRAND.name} — ${BRAND.motto}`,
  fitness: `${BRAND.name} Fitness`,
  productivity: `${BRAND.name} Productivity`,
  finance: `${BRAND.name} Finance`,
};

const BrandLogo = ({ kind = "app", className, alt }: BrandLogoProps) => (
  <img
    src={BRAND_LOGOS[kind]}
    alt={alt ?? ALT_TEXT[kind]}
    loading="lazy"
    decoding="async"
    draggable={false}
    className={cn("block object-contain", className)}
  />
);

export default BrandLogo;
