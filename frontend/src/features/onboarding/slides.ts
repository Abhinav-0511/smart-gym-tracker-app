import {
  ArrowLeftRight,
  LayoutGrid,
  LifeBuoy,
  MessageSquare,
  Rocket,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/** A single module shown on the combined "modules" slide. */
export interface OnboardingModule {
  name: string;
  desc: string;
}

export interface OnboardingSlide {
  id: string;
  icon: LucideIcon;
  title: string;
  /** Body lines, rendered stacked. */
  lines?: string[];
  /** When present, the slide renders this branded module list instead of lines. */
  modules?: OnboardingModule[];
}

/**
 * The first-run introduction, shown once per account. Copy is kept as data so it
 * is trivial to edit. The three modules share one slide; separate slides cover
 * how to move between them, sending feedback, and getting support.
 */
export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to LifeTrack",
    lines: ["One app to organize your", "Fitness, Productivity,", "and Finances."],
  },
  {
    id: "modules",
    icon: LayoutGrid,
    title: "Three apps in one",
    modules: [
      { name: "Fitness", desc: "Workouts, Progress & Achievements" },
      { name: "Productivity", desc: "Tasks, Habits & Goals" },
      { name: "Finance", desc: "Expenses, Budget & Savings" },
    ],
  },
  {
    id: "switch-modules",
    icon: ArrowLeftRight,
    title: "Switch anytime",
    lines: [
      "Tap the LifeTrack logo",
      "to move between your modules —",
      "everything stays in one account.",
    ],
  },
  {
    id: "feedback",
    icon: MessageSquare,
    title: "Share your feedback",
    lines: [
      "Got an idea or spotted a bug?",
      "Send feedback from the Help",
      "Center — we read every note.",
    ],
  },
  {
    id: "support",
    icon: LifeBuoy,
    title: "Help is one tap away",
    lines: [
      "Open the Help (?) button in the",
      "header for guides, or raise a",
      "support ticket when you’re stuck.",
    ],
  },
  {
    id: "insights",
    icon: TrendingUp,
    title: "Insights",
    lines: ["See your progress", "across every area of life."],
  },
  {
    id: "ready",
    icon: Rocket,
    title: "You’re Ready",
    lines: ["Start building a better life."],
  },
];
