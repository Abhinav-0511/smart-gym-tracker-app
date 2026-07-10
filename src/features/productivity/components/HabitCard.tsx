import {
  Archive,
  ArchiveRestore,
  Check,
  Flame,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getHabitColorClasses } from "@/features/productivity/lib/habit-colors";
import { getHabitIcon } from "@/features/productivity/lib/habit-icons";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import { isHabitDueOn, type HabitStatus } from "@/features/productivity/types/habit";
import { parseDateKey } from "@/features/productivity/lib/date-keys";
import HabitHeatmap from "@/features/productivity/components/HabitHeatmap";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatFrequency(habit: HabitWithHistory): string {
  switch (habit.frequency) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Weekdays";
    case "custom":
      return (habit.customDays ?? []).map((day) => WEEKDAY_LABELS[day - 1]).join(", ") || "Custom";
    default:
      return "";
  }
}

interface HabitCardProps {
  habit: HabitWithHistory;
  todayKey: string;
  onToggle: (habit: HabitWithHistory, complete: boolean) => void;
  onEdit: (habit: HabitWithHistory) => void;
  onStatusChange: (habit: HabitWithHistory, status: HabitStatus) => void;
  onDelete: (habit: HabitWithHistory) => void;
}

const HabitCard = ({
  habit,
  todayKey,
  onToggle,
  onEdit,
  onStatusChange,
  onDelete,
}: HabitCardProps) => {
  const colors = getHabitColorClasses(habit.color);
  const Icon = getHabitIcon(habit.icon);
  const dueToday = isHabitDueOn(habit, parseDateKey(todayKey));
  const done = habit.stats.completedToday;
  const isArchived = habit.status === "archived";
  const isPaused = habit.status === "paused";

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", colors.chip)}>
          <Icon size={22} className={colors.icon} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-foreground">{habit.title}</h3>
            {isPaused && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Paused
              </span>
            )}
            {isArchived && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Archived
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
            {habit.category} · {formatFrequency(habit)}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {!isArchived && (
            <button
              type="button"
              aria-label={done ? "Mark habit not done" : "Mark habit done"}
              aria-pressed={done}
              onClick={() => onToggle(habit, !done)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                done
                  ? cn(colors.solid, "border-transparent text-white")
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary",
              )}
            >
              <Check size={18} strokeWidth={done ? 3 : 2} />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Habit options"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => onEdit(habit)} className="cursor-pointer gap-2">
                <Pencil size={15} /> Edit
              </DropdownMenuItem>
              {!isArchived && isPaused && (
                <DropdownMenuItem onSelect={() => onStatusChange(habit, "active")} className="cursor-pointer gap-2">
                  <Play size={15} /> Resume
                </DropdownMenuItem>
              )}
              {!isArchived && !isPaused && (
                <DropdownMenuItem onSelect={() => onStatusChange(habit, "paused")} className="cursor-pointer gap-2">
                  <Pause size={15} /> Pause
                </DropdownMenuItem>
              )}
              {isArchived ? (
                <DropdownMenuItem onSelect={() => onStatusChange(habit, "active")} className="cursor-pointer gap-2">
                  <ArchiveRestore size={15} /> Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => onStatusChange(habit, "archived")} className="cursor-pointer gap-2">
                  <Archive size={15} /> Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(habit)}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 size={15} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <Flame size={16} className={habit.stats.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"} />
          {habit.stats.currentStreak}
          <span className="font-normal text-muted-foreground">day streak</span>
        </span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{habit.stats.completionRate}%</span> · 30d
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          Best {habit.stats.longestStreak}
        </span>
      </div>

      <HabitHeatmap
        color={habit.color}
        frequency={habit.frequency}
        customDays={habit.customDays}
        completedKeys={habit.recentCompletedKeys}
        todayKey={todayKey}
      />

      {!isArchived && !dueToday && (
        <p className="text-xs text-muted-foreground">Not scheduled today — enjoy your rest.</p>
      )}
    </GlassCard>
  );
};

export default HabitCard;
