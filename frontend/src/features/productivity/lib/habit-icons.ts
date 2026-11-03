import {
  Activity,
  BookOpen,
  Brain,
  CircleCheck,
  Code,
  Coffee,
  Droplet,
  Dumbbell,
  Footprints,
  GraduationCap,
  Heart,
  Languages,
  Leaf,
  type LucideIcon,
  Moon,
  Music,
  PenLine,
  Sparkles,
  Sun,
  Target,
  Users,
  Wallet,
} from "lucide-react";

// Curated set of habit icons. Keys are the kebab-case names stored in the DB.
const HABIT_ICON_MAP: Record<string, LucideIcon> = {
  "circle-check": CircleCheck,
  dumbbell: Dumbbell,
  "book-open": BookOpen,
  brain: Brain,
  code: Code,
  languages: Languages,
  droplet: Droplet,
  moon: Moon,
  sun: Sun,
  heart: Heart,
  target: Target,
  sparkles: Sparkles,
  footprints: Footprints,
  "pen-line": PenLine,
  coffee: Coffee,
  music: Music,
  leaf: Leaf,
  wallet: Wallet,
  users: Users,
  "graduation-cap": GraduationCap,
  activity: Activity,
};

/** Ordered icon names for the picker UI. */
export const HABIT_ICON_NAMES: readonly string[] = Object.keys(HABIT_ICON_MAP);

export function getHabitIcon(name: string): LucideIcon {
  return HABIT_ICON_MAP[name] ?? CircleCheck;
}
