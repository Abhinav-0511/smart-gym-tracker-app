/**
 * Contextual help is entirely data-driven: one {@link PageHelpConfig} per major
 * page, held in the help registry. Components only render this config — no help
 * copy is hard-coded in JSX — so keeping help accurate as features change is a
 * one-file edit and can never silently drift from the UI.
 *
 * Content rule (enforced by authoring, not types): every tip, FAQ answer, and
 * "About" marker must describe a control that actually exists on that page. No
 * invented shortcuts, gestures, or unshipped features.
 */

/** A single numbered callout on the illustrated "About this page" guide. */
export interface HelpMarker {
  /** Marker number, shown as a badge on the screenshot and in the list. */
  n: number;
  /** Short label for the region. */
  label: string;
  /** What that region does. */
  description: string;
}

/** The illustrated guide for a page. */
export interface HelpAbout {
  /**
   * Screenshot filename resolved from `/help/<screenshot>` (public folder).
   * The UI degrades gracefully to a placeholder until the image is added.
   */
  screenshot: string;
  /** One or two sentences describing the page as a whole. */
  intro: string;
  /** Numbered regions of the screenshot, in reading order. */
  markers: HelpMarker[];
}

/** Everything the Help Center needs to render for one page. */
export interface PageHelpConfig {
  /** Stable key, e.g. "fitness.dashboard". */
  pageKey: string;
  /** Human page name shown in the Help Center header. */
  title: string;
  about: HelpAbout;
  /** True, verifiable tips only. */
  tips: string[];
  /** True, verifiable Q&A only. */
  faq: { q: string; a: string }[];
}
