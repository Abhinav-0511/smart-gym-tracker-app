import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ListTodo, Plus, Search } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getLocalDateString } from "@/types/dashboard";
import { useTasks } from "@/features/productivity/hooks/useTasks";
import TaskItem from "@/features/productivity/components/TaskItem";
import TaskFormDialog from "@/features/productivity/components/TaskFormDialog";
import {
  isTaskInView,
  PRIORITY_LABELS,
  sortTasks,
  TASK_SORTS,
  TASK_VIEWS,
  type TaskSort,
  type TaskView,
} from "@/features/productivity/lib/task-format";
import {
  getTaskDerivedStatus,
  TASK_PRIORITIES,
  type CreateTaskInput,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/features/productivity/types/task";
import { cn } from "@/lib/utils";

type ViewTab = TaskView | "archived";

const VIEW_TABS: { id: ViewTab; label: string }[] = [
  ...TASK_VIEWS,
  { id: "archived", label: "Archived" },
];

type PriorityFilter = TaskPriority | "all";

const TasksPage = () => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const { toast } = useToast();

  const {
    todayKey,
    tasksQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    duplicateMutation,
    statusMutation,
  } = useTasks(user?.id, timezone, true);

  const [view, setView] = useState<ViewTab>("today");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [sort, setSort] = useState<TaskSort>("smart");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const now = new Date();
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  // Search + priority filters applied before view bucketing so the tab counts
  // reflect the active filters.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesPriority = priority === "all" || task.priority === priority;
      const matchesSearch =
        !query
        || task.title.toLowerCase().includes(query)
        || (task.description?.toLowerCase().includes(query) ?? false)
        || (task.location?.toLowerCase().includes(query) ?? false);
      return matchesPriority && matchesSearch;
    });
  }, [tasks, priority, search]);

  const inView = (task: Task, tab: ViewTab) =>
    tab === "archived" ? task.status === "archived" : isTaskInView(task, tab, todayKey, now);

  const counts = useMemo(() => {
    const record = {} as Record<ViewTab, number>;
    for (const tab of VIEW_TABS) {
      record[tab.id] = filtered.filter((task) => inView(task, tab.id)).length;
    }
    return record;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, todayKey]);

  const visibleTasks = useMemo(
    () => sortTasks(filtered.filter((task) => inView(task, view)), sort, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, view, sort, todayKey],
  );

  const summary = useMemo(() => {
    const pending = tasks.filter((task) => task.status === "pending");
    const overdue = pending.filter((task) => getTaskDerivedStatus(task, now) === "overdue");
    const dueToday = pending.filter(
      (task) => task.dueDate === todayKey || getTaskDerivedStatus(task, now) === "overdue",
    );
    const completedToday = tasks.filter(
      (task) =>
        task.status === "completed"
        && task.completedAt
        && getLocalDateString(new Date(task.completedAt), timezone) === todayKey,
    );
    return {
      dueToday: dueToday.length,
      overdue: overdue.length,
      completedToday: completedToday.length,
      pending: pending.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, todayKey, timezone]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setFormOpen(true);
  };

  const handleSubmit = async (input: CreateTaskInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ taskId: editing.id, input });
      toast({ title: "Task updated" });
    } else {
      await createMutation.mutateAsync(input);
      toast({ title: "Task created" });
    }
  };

  const handleToggleComplete = (task: Task) => {
    statusMutation.mutate({
      taskId: task.id,
      status: task.status === "completed" ? "pending" : "completed",
    });
  };

  const handleStatus = (task: Task, status: TaskStatus) => {
    statusMutation.mutate(
      { taskId: task.id, status },
      {
        onSuccess: () =>
          toast({
            title:
              status === "archived"
                ? "Task archived"
                : status === "cancelled"
                  ? "Task cancelled"
                  : status === "completed"
                    ? "Task completed"
                    : "Task reopened",
          }),
      },
    );
  };

  const handleDuplicate = (task: Task) => {
    duplicateMutation.mutate(task, {
      onSuccess: () => toast({ title: "Task duplicated" }),
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => toast({ title: "Task deleted" }),
      onError: (error) =>
        toast({
          title: "Couldn’t delete task",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        }),
    });
    setPendingDelete(null);
  };

  const stats = [
    { label: "Due today", value: summary.dueToday, icon: ListTodo },
    { label: "Overdue", value: summary.overdue, icon: AlertTriangle },
    { label: "Done today", value: summary.completedToday, icon: CheckCircle2 },
    { label: "Pending", value: summary.pending, icon: ListTodo },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
            className="pl-9"
            aria-label="Search tasks"
          />
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus size={18} /> New Task
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <stat.icon size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className="mt-1 text-2xl font-extrabold text-foreground">{stat.value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition",
              view === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs",
                view === tab.id ? "bg-primary-foreground/20" : "bg-background/60",
              )}
            >
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={priority} onValueChange={(value) => setPriority(value as PriorityFilter)}>
          <SelectTrigger className="h-9 w-36" aria-label="Filter by priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {TASK_PRIORITIES.map((item) => (
              <SelectItem key={item} value={item}>
                {PRIORITY_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => setSort(value as TaskSort)}>
          <SelectTrigger className="h-9 w-40" aria-label="Sort tasks">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_SORTS.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                Sort: {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tasksQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : tasksQuery.isError ? (
        <GlassCard className="text-center">
          <p className="text-sm text-destructive">Couldn’t load your tasks.</p>
          <Button variant="outline" className="mt-3" onClick={() => tasksQuery.refetch()}>
            Retry
          </Button>
        </GlassCard>
      ) : visibleTasks.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ListTodo size={26} />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {tasks.length === 0 ? "No tasks yet" : "Nothing here"}
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {tasks.length === 0
              ? "Productivity begins with one task. Add yours to start planning your day."
              : "No tasks match this view or filters."}
          </p>
          {tasks.length === 0 && (
            <Button onClick={openCreate} className="mt-1">
              <Plus size={18} /> New Task
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              now={now}
              onToggleComplete={handleToggleComplete}
              onEdit={openEdit}
              onDuplicate={handleDuplicate}
              onStatus={handleStatus}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        task={editing}
        saving={createMutation.isPending || updateMutation.isPending}
        defaultDueDate={view === "tomorrow" ? undefined : todayKey}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TasksPage;
