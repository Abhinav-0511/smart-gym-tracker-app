import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  Check,
  Copy,
  MapPin,
  MoreVertical,
  Pencil,
  Repeat,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

import GlassCard from "@/components/GlassCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseDateKey } from "@/features/productivity/lib/date-keys";
import { getStatusLabel } from "@/features/productivity/lib/task-format";
import {
  getTaskDerivedStatus,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/features/productivity/types/task";
import { cn } from "@/lib/utils";

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  low: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  medium: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  urgent: "bg-red-500/15 text-red-600 dark:text-red-400",
};

function formatDue(task: Task): string | null {
  if (!task.dueDate) return null;
  const label = format(parseDateKey(task.dueDate), "MMM d");
  if (task.dueTime) return `${label} · ${task.dueTime.slice(0, 5)}`;
  return label;
}

interface TaskItemProps {
  task: Task;
  now?: Date;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onStatus: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
}

const TaskItem = ({
  task,
  now = new Date(),
  onToggleComplete,
  onEdit,
  onDuplicate,
  onStatus,
  onDelete,
}: TaskItemProps) => {
  const derived = getTaskDerivedStatus(task, now);
  const isCompleted = task.status === "completed";
  const isCancelled = task.status === "cancelled";
  const isArchived = task.status === "archived";
  const isOverdue = derived === "overdue";
  const due = formatDue(task);
  const inactive = isCompleted || isCancelled;

  return (
    <GlassCard className="flex items-start gap-3 p-4">
      <button
        type="button"
        aria-label={isCompleted ? "Mark task incomplete" : "Mark task complete"}
        aria-pressed={isCompleted}
        onClick={() => onToggleComplete(task)}
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isCompleted
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-border text-transparent hover:border-primary",
        )}
      >
        <Check size={14} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-semibold text-foreground",
              inactive && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Task options"
                className="-mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => onEdit(task)} className="cursor-pointer gap-2">
                <Pencil size={15} /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDuplicate(task)} className="cursor-pointer gap-2">
                <Copy size={15} /> Duplicate
              </DropdownMenuItem>
              {isCompleted ? (
                <DropdownMenuItem onSelect={() => onStatus(task, "pending")} className="cursor-pointer gap-2">
                  <RotateCcw size={15} /> Reopen
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => onStatus(task, "cancelled")} className="cursor-pointer gap-2">
                  <XCircle size={15} /> Cancel
                </DropdownMenuItem>
              )}
              {isArchived ? (
                <DropdownMenuItem onSelect={() => onStatus(task, "pending")} className="cursor-pointer gap-2">
                  <ArchiveRestore size={15} /> Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => onStatus(task, "archived")} className="cursor-pointer gap-2">
                  <Archive size={15} /> Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(task)}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 size={15} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className={cn("rounded-full px-2 py-0.5 font-semibold", PRIORITY_CLASSES[task.priority])}>
            {task.priority}
          </span>
          {isOverdue && (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-semibold text-destructive">
              {getStatusLabel("overdue")}
            </span>
          )}
          {due && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-muted-foreground",
                isOverdue && "text-destructive",
              )}
            >
              <CalendarClock size={13} /> {due}
            </span>
          )}
          {task.repeat !== "none" && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Repeat size={13} /> {task.repeat}
            </span>
          )}
          {task.location && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MapPin size={13} /> {task.location}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default TaskItem;
