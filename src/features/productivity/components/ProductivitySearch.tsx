import { useEffect, useState } from "react";
import { CheckSquare, ListTodo, Search, Tag } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/features/productivity/hooks/useHabits";
import { useTasks } from "@/features/productivity/hooks/useTasks";

interface ProductivitySearchProps {
  onNavigate: (page: string) => void;
}

/**
 * Global search across habits, tasks and categories. Opens from the header
 * button or the ⌘/Ctrl-K shortcut; selecting a result jumps to its page.
 */
const ProductivitySearch = ({ onNavigate }: ProductivitySearchProps) => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const [open, setOpen] = useState(false);

  const habits = useHabits(user?.id, timezone, true);
  const tasks = useTasks(user?.id, timezone, true);

  const habitList = habits.habitsQuery.data ?? [];
  const taskList = tasks.tasksQuery.data ?? [];
  const categories = Array.from(new Set(habitList.map((habit) => habit.category)));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (page: string) => {
    setOpen(false);
    onNavigate(page);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Search size={18} />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search habits, tasks and categories…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {habitList.length > 0 && (
            <CommandGroup heading="Habits">
              {habitList.map((habit) => (
                <CommandItem
                  key={habit.id}
                  value={`habit ${habit.title} ${habit.category}`}
                  onSelect={() => go("habits")}
                >
                  <CheckSquare size={15} />
                  <span className="truncate">{habit.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {taskList.length > 0 && (
            <CommandGroup heading="Tasks">
              {taskList.map((task) => (
                <CommandItem
                  key={task.id}
                  value={`task ${task.title} ${task.description ?? ""} ${task.location ?? ""}`}
                  onSelect={() => go("tasks")}
                >
                  <ListTodo size={15} />
                  <span className="truncate">{task.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {categories.length > 0 && (
            <CommandGroup heading="Categories">
              {categories.map((category) => (
                <CommandItem
                  key={category}
                  value={`category ${category}`}
                  onSelect={() => go("habits")}
                >
                  <Tag size={15} />
                  <span className="capitalize">{category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default ProductivitySearch;
