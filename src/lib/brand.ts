import appLogo from "../../images/Main_App_Logo.png";
import fullLogo from "../../images/Full_Logo.png";
import fitnessLogo from "../../images/Fitness_Logo.png";
import productivityLogo from "../../images/Productivity_Logo.png";
import financeLogo from "../../images/Finance_Logo.png";

import type { WorkspaceId } from "@/features/workspace/types";

/**
 * Single source of truth for LifeTrack brand identity. Every screen — splash,
 * auth, sidebar, dashboards, settings, error states — reads its name, motto,
 * company line and logos from here so a future brand tweak is a one-file change.
 *
 * "Powered by Vernex Gen Technologies" is the immutable company attribution and
 * must appear wherever branding is shown; it is intentionally not derived from
 * anything else so it can never drift.
 */
export const BRAND = {
  /** Product name. */
  name: "LifeTrack",
  /** Official motto / tagline. */
  motto: "Track Your Life. Improve Every Day.",
  /** Short two-word motto for tight spaces. */
  mottoShort: "Track Your Life.",
  /** Company attribution — do not change. */
  company: "Vernex Gen Technologies",
  /** Full company attribution line shown in footers/about. */
  poweredBy: "Powered by Vernex Gen Technologies",
  /** Product one-liner used in meta descriptions. */
  description:
    "LifeTrack unifies your fitness, productivity and finances in one premium life-management app.",
  /** Displayed app version (About screen). */
  version: "1.0.0",
} as const;

/**
 * The brand logo set. `app` is the icon mark (sidebar, splash, favicon,
 * loaders, avatars fallback); `full` is the horizontal lockup (login, splash,
 * about). The three module marks brand their respective workspaces.
 */
export const BRAND_LOGOS = {
  app: appLogo,
  full: fullLogo,
  fitness: fitnessLogo,
  productivity: productivityLogo,
  finance: financeLogo,
} as const;

export type BrandLogoKind = keyof typeof BRAND_LOGOS;

const WORKSPACE_LOGO: Record<WorkspaceId, BrandLogoKind> = {
  fitness: "fitness",
  productivity: "productivity",
  finance: "finance",
};

/** Resolve the branded logo asset for a workspace. */
export function workspaceLogo(id: WorkspaceId): string {
  return BRAND_LOGOS[WORKSPACE_LOGO[id]];
}
