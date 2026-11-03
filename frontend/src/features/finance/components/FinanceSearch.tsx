import { useEffect, useState } from "react";
import { ArrowLeftRight, Search, Tag } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/useAuth";
import { useFinanceData } from "@/features/finance/hooks/useFinanceData";
import { formatCurrency } from "@/features/finance/lib/money";
import { sortByRecency } from "@/features/finance/lib/filters";
import { PAYMENT_METHOD_LABELS } from "@/features/finance/types/common";

interface FinanceSearchProps {
  onNavigate: (page: string) => void;
}

/**
 * Global search across transactions and categories. Opens from the header
 * button or ⌘/Ctrl-K; selecting a result jumps to the relevant page.
 */
const FinanceSearch = ({ onNavigate }: FinanceSearchProps) => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const currency = "INR";
  const [open, setOpen] = useState(false);

  const { transactions, categories, categoriesById } = useFinanceData(user?.id, timezone);
  const recent = sortByRecency(transactions).slice(0, 40);

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
        <CommandInput placeholder="Search transactions and categories…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {recent.length > 0 && (
            <CommandGroup heading="Transactions">
              {recent.map((tx) => {
                const category = tx.categoryId ? categoriesById.get(tx.categoryId) : undefined;
                return (
                  <CommandItem
                    key={tx.id}
                    value={`tx ${tx.title} ${category?.name ?? ""} ${tx.tags.join(" ")} ${PAYMENT_METHOD_LABELS[tx.paymentMethod]} ${tx.amount}`}
                    onSelect={() => go("transactions")}
                    className="justify-between gap-2"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <ArrowLeftRight size={15} />
                      <span className="truncate">{tx.title}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                      {formatCurrency(tx.amount, currency)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {categories.length > 0 && (
            <CommandGroup heading="Categories">
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`category ${category.name} ${category.kind}`}
                  onSelect={() => go("transactions")}
                >
                  <Tag size={15} />
                  <span>{category.name}</span>
                  <span className="ml-auto text-xs capitalize text-muted-foreground">{category.kind}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default FinanceSearch;
