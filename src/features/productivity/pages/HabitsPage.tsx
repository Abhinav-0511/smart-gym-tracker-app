import { useMemo, useState } from "react";
import { CheckCircle2, Flame, ListChecks, Plus, Search, Target } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useHabits } from "@/features/productivity/hooks/useHabits";
import HabitCard from "@/features/productivity/components/HabitCard";
import HabitFormDialog from "@/features/productivity/components/HabitFormDialog";
import type { HabitWithHistory } from "@/features/productivity/services/habits";
import { isHabitDueOn } from "@/features/productivity/types/habit";
import { parseDateKey } from "@/features/productivity/lib/date-keys";
import type {
  CreateHabitInput,
  HabitStatus,
} from "@/features/productivity/types/habit";
import { cn } from "@/lib/utils";

type HabitFilter = "active" | "paused" | "archived" | "all";

const FILTERS: { id: HabitFilter; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "archived", label: "Archived" },
  { id: "all", label: "All" },
];

const HabitsPage = () => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const { toast } = useToast();

  const {
    todayKey,
    habitsQuery,
    createMutation,
    updateMutation,
    statusMutation,
    deleteMutation,
    toggleMutation,
  } = useHabits(user?.id, timezone, true);

  const [filter, setFilter] = useState<HabitFilter>("active");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HabitWithHistory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HabitWithHistory | null>(null);

  const habits = useMemo(() => habitsQuery.data ?? [], [habitsQuery.data]);

  const visibleHabits = useMemo(() => {
    const query = search.trim().toLowerCase();
    return habits.filter((habit) => {
      const matchesFilter = filter === "all" || habit.status === filter;
      const matchesSearch =
        !query
        || habit.title.toLowerCase().includes(query)
        || habit.category.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [habits, filter, search]);

  const summary = useMemo(() => {
    const active = habits.filter((habit) => habit.status === "active");
    const dueToday = active.filter((habit) => isHabitDueOn(habit, parseDateKey(todayKey)));
    const completedToday = dueToday.filter((habit) => habit.stats.completedToday);
    const rate = active.length
      ? Math.round(active.reduce((sum, habit) => sum + habit.stats.completionRate, 0) / active.length)
      : 0;
    const bestStreak = active.reduce((max, habit) => Math.max(max, habit.stats.currentStreak), 0);
    return {
      activeCount: active.length,
      dueTotal: dueToday.length,
      completedCount: completedToday.length,
      rate,
      bestStreak,
    };
  }, [habits, todayKey]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (habit: HabitWithHistory) => {
    setEditing(habit);
    setFormOpen(true);
  };

  const handleSubmit = async (input: CreateHabitInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ habitId: editing.id, input });
      toast({ title: "Habit updated" });
    } else {
      await createMutation.mutateAsync(input);
      toast({ title: "Habit created" });
    }
  };

  const handleToggle = (habit: HabitWithHistory, complete: boolean) => {
    toggleMutation.mutate({ habit, dateKey: todayKey, complete });
  };

  const handleStatus = (habit: HabitWithHistory, status: HabitStatus) => {
    statusMutation.mutate(
      { habitId: habit.id, status },
      {
        onSuccess: () =>
          toast({
            title:
              status === "archived"
                ? "Habit archived"
                : status === "paused"
                  ? "Habit paused"
                  : "Habit active",
          }),
      },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    deleteMutation.mutate(target.id, {
      onSuccess: () => toast({ title: "Habit deleted" }),
      onError: (error) =>
        toast({
          title: "Couldn’t delete habit",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        }),
    });
    setPendingDelete(null);
  };

  const stats = [
    { label: "Today", value: `${summary.completedCount}/${summary.dueTotal}`, icon: CheckCircle2 },
    { label: "Active", value: summary.activeCount, icon: ListChecks },
    { label: "Avg 30d", value: `${summary.rate}%`, icon: Target },
    { label: "Best streak", value: summary.bestStreak, icon: Flame },
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
            placeholder="Search habits"
            className="pl-9"
            aria-label="Search habits"
          />
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus size={18} /> New Habit
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

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              filter === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {habitsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : habitsQuery.isError ? (
        <GlassCard className="text-center">
          <p className="text-sm text-destructive">Couldn’t load your habits.</p>
          <Button variant="outline" className="mt-3" onClick={() => habitsQuery.refetch()}>
            Retry
          </Button>
        </GlassCard>
      ) : visibleHabits.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ListChecks size={26} />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {habits.length === 0 ? "No habits yet" : "Nothing here"}
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {habits.length === 0
              ? "Create your first habit to start building streaks."
              : "No habits match this filter or search."}
          </p>
          {habits.length === 0 && (
            <Button onClick={openCreate} className="mt-1">
              <Plus size={18} /> New Habit
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              todayKey={todayKey}
              onToggle={handleToggle}
              onEdit={openEdit}
              onStatusChange={handleStatus}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <HabitFormDialog
        open={formOpen}
        habit={editing}
        saving={createMutation.isPending || updateMutation.isPending}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this habit?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” and all its completion history will be permanently removed.
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

export default HabitsPage;
