import { useMemo, useState } from "react";
import { Plus, Repeat, Search, SlidersHorizontal } from "lucide-react";
import { toast as sonnerToast } from "sonner";

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
import DayDetailSheet from "@/features/finance/components/DayDetailSheet";
import FinanceCalendar from "@/features/finance/components/FinanceCalendar";
import MonthNav from "@/features/finance/components/MonthNav";
import RecurringFormDialog from "@/features/finance/components/RecurringFormDialog";
import RecurringItem from "@/features/finance/components/RecurringItem";
import TransactionFilterSheet from "@/features/finance/components/TransactionFilterSheet";
import TransactionFormDialog from "@/features/finance/components/TransactionFormDialog";
import TransactionItem from "@/features/finance/components/TransactionItem";
import { useFinanceData } from "@/features/finance/hooks/useFinanceData";
import { useRecurring } from "@/features/finance/hooks/useRecurring";
import { useTransactions } from "@/features/finance/hooks/useTransactions";
import { buildMonthGrid, transactionsOnDay } from "@/features/finance/lib/calendar";
import { formatDayLabel, isInMonth } from "@/features/finance/lib/dates";
import {
  defaultFilters,
  filterTransactions,
  hasActiveFilters,
  sortByRecency,
  type TransactionFilters,
} from "@/features/finance/lib/filters";
import { formatCurrency } from "@/features/finance/lib/money";
import { DEFAULT_CURRENCY } from "@/features/finance/types/common";
import type {
  CreateRecurringInput,
  RecurringTransaction,
} from "@/features/finance/types/recurring";
import type {
  CreateTransactionInput,
  Transaction,
} from "@/features/finance/types/transaction";
import { cn } from "@/lib/utils";

type View = "list" | "calendar" | "recurring";

const PAGE_SIZE = 25;

const VIEWS: { id: View; label: string }[] = [
  { id: "list", label: "List" },
  { id: "calendar", label: "Calendar" },
  { id: "recurring", label: "Recurring" },
];

function toCreateInput(tx: Transaction): CreateTransactionInput {
  return {
    type: tx.type,
    amount: tx.amount,
    title: tx.title,
    categoryId: tx.categoryId,
    accountId: tx.accountId,
    paymentMethod: tx.paymentMethod,
    occurredOn: tx.occurredOn,
    occurredAt: tx.occurredAt,
    notes: tx.notes,
    tags: tx.tags,
    transferAccountId: tx.transferAccountId,
  };
}

const TransactionsPage = () => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const currency = DEFAULT_CURRENCY;
  const { toast } = useToast();

  const data = useFinanceData(user?.id, timezone);
  const { transactionsQuery, createMutation, updateMutation, deleteMutation } = useTransactions(
    user?.id,
    timezone,
  );
  const recurring = useRecurring(user?.id);

  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters());
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [formDate, setFormDate] = useState(data.todayKey);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const [calendarMonth, setCalendarMonth] = useState(data.monthKey);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [recurringFormOpen, setRecurringFormOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [pendingRecurringDelete, setPendingRecurringDelete] =
    useState<RecurringTransaction | null>(null);

  const filtered = useMemo(() => {
    const withSearch = { ...filters, search };
    return sortByRecency(filterTransactions(data.transactions, withSearch, data.categoryNameById));
  }, [data.transactions, data.categoryNameById, filters, search]);

  const visible = filtered.slice(0, visibleCount);

  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const tx of visible) {
      const list = groups.get(tx.occurredOn) ?? [];
      list.push(tx);
      groups.set(tx.occurredOn, list);
    }
    return [...groups.entries()];
  }, [visible]);

  const calendarCells = useMemo(
    () =>
      buildMonthGrid(
        calendarMonth,
        data.transactions.filter((tx) => isInMonth(tx.occurredOn, calendarMonth)),
        data.todayKey,
      ),
    [calendarMonth, data.transactions, data.todayKey],
  );

  const dayTransactions = useMemo(
    () => (selectedDay ? transactionsOnDay(data.transactions, selectedDay) : []),
    [selectedDay, data.transactions],
  );

  const openCreate = (dateKey?: string) => {
    setEditing(null);
    setFormDate(dateKey ?? data.todayKey);
    setFormOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setFormOpen(true);
  };

  const handleSubmit = async (input: CreateTransactionInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, input });
      toast({ title: "Transaction updated" });
    } else {
      await createMutation.mutateAsync(input);
      toast({ title: "Transaction added" });
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        sonnerToast("Transaction deleted", {
          action: {
            label: "Undo",
            onClick: () => {
              createMutation.mutate(toCreateInput(target));
            },
          },
        });
      },
      onError: (error) =>
        toast({
          title: "Couldn’t delete",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        }),
    });
    setPendingDelete(null);
  };

  const handleRecurringSubmit = async (input: CreateRecurringInput) => {
    if (editingRecurring) {
      await recurring.updateMutation.mutateAsync({ id: editingRecurring.id, input });
      toast({ title: "Recurring updated" });
    } else {
      await recurring.createMutation.mutateAsync(input);
      toast({ title: "Recurring created" });
    }
  };

  const handlePost = (item: RecurringTransaction) => {
    recurring.postMutation.mutate(item, {
      onSuccess: () => toast({ title: `Posted ${item.title}` }),
      onError: (error) =>
        toast({
          title: "Couldn’t post",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        }),
    });
  };

  const recurringList = recurring.recurringQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                view === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Button onClick={() => (view === "recurring" ? setRecurringFormOpen(true) : openCreate())}>
          <Plus size={18} /> {view === "recurring" ? "New Recurring" : "Add"}
        </Button>
      </div>

      {view === "list" && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search transactions"
                className="pl-9"
                aria-label="Search transactions"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setFilterOpen(true)}
              className={cn(hasActiveFilters(filters) && "border-primary text-primary")}
            >
              <SlidersHorizontal size={16} /> Filters
            </Button>
          </div>

          {transactionsQuery.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((index) => (
                <Skeleton key={index} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : transactionsQuery.isError ? (
            <GlassCard className="text-center">
              <p className="text-sm text-destructive">Couldn’t load your transactions.</p>
              <Button variant="outline" className="mt-3" onClick={() => transactionsQuery.refetch()}>
                Retry
              </Button>
            </GlassCard>
          ) : filtered.length === 0 ? (
            <GlassCard className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Search size={24} />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {data.transactions.length === 0 ? "No transactions yet" : "Nothing matches"}
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                {data.transactions.length === 0
                  ? "Add your first transaction to get started."
                  : "Try adjusting your search or filters."}
              </p>
              {data.transactions.length === 0 && (
                <Button className="mt-1" onClick={() => openCreate()}>
                  <Plus size={18} /> Add Transaction
                </Button>
              )}
            </GlassCard>
          ) : (
            <div className="space-y-5">
              {grouped.map(([dateKey, items]) => {
                const dayNet = items.reduce(
                  (sum, tx) => sum + (tx.type === "income" ? tx.amount : tx.type === "expense" ? -tx.amount : 0),
                  0,
                );
                return (
                  <div key={dateKey} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {formatDayLabel(dateKey)}
                      </span>
                      <span className={cn("text-xs font-semibold", dayNet >= 0 ? "text-emerald-500" : "text-rose-500")}>
                        {formatCurrency(dayNet, currency)}
                      </span>
                    </div>
                    {items.map((tx) => (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        category={tx.categoryId ? data.categoriesById.get(tx.categoryId) : undefined}
                        currency={currency}
                        showDate={false}
                        onEdit={openEdit}
                        onDelete={setPendingDelete}
                      />
                    ))}
                  </div>
                );
              })}
              {visibleCount < filtered.length && (
                <Button variant="outline" className="w-full" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                  Load more ({filtered.length - visibleCount})
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {view === "calendar" && (
        <GlassCard>
          <div className="mb-4 flex items-center justify-center">
            <MonthNav monthKey={calendarMonth} onChange={setCalendarMonth} maxMonthKey={data.monthKey} />
          </div>
          <FinanceCalendar cells={calendarCells} currency={currency} onSelectDay={setSelectedDay} />
        </GlassCard>
      )}

      {view === "recurring" && (
        <>
          {recurring.recurringQuery.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : recurringList.length === 0 ? (
            <GlassCard className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Repeat size={24} />
              </div>
              <h3 className="text-base font-bold text-foreground">No recurring transactions</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Set up salary, rent, or subscriptions so they’re one tap to log.
              </p>
              <Button className="mt-1" onClick={() => setRecurringFormOpen(true)}>
                <Plus size={18} /> New Recurring
              </Button>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {recurringList.map((item) => (
                <RecurringItem
                  key={item.id}
                  recurring={item}
                  category={item.categoryId ? data.categoriesById.get(item.categoryId) : undefined}
                  currency={currency}
                  posting={recurring.postMutation.isPending}
                  onPost={handlePost}
                  onToggleActive={(rec) =>
                    recurring.updateMutation.mutate({ id: rec.id, input: { isActive: !rec.isActive } })
                  }
                  onEdit={(rec) => {
                    setEditingRecurring(rec);
                    setRecurringFormOpen(true);
                  }}
                  onDelete={setPendingRecurringDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      <TransactionFormDialog
        open={formOpen}
        transaction={editing}
        categories={data.categories}
        accounts={data.accounts}
        defaultDateKey={formDate}
        saving={createMutation.isPending || updateMutation.isPending}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <RecurringFormDialog
        open={recurringFormOpen}
        recurring={editingRecurring}
        categories={data.categories}
        accounts={data.accounts}
        defaultDateKey={data.todayKey}
        saving={recurring.createMutation.isPending || recurring.updateMutation.isPending}
        onOpenChange={(next) => {
          setRecurringFormOpen(next);
          if (!next) setEditingRecurring(null);
        }}
        onSubmit={handleRecurringSubmit}
      />

      <TransactionFilterSheet
        open={filterOpen}
        filters={filters}
        categories={data.categories}
        onOpenChange={setFilterOpen}
        onChange={setFilters}
        onClear={() => setFilters(defaultFilters())}
      />

      <DayDetailSheet
        open={selectedDay !== null}
        dateKey={selectedDay}
        transactions={dayTransactions}
        categoriesById={data.categoriesById}
        currency={currency}
        onOpenChange={(open) => !open && setSelectedDay(null)}
        onEdit={(tx) => {
          setSelectedDay(null);
          openEdit(tx);
        }}
        onDelete={(tx) => {
          setSelectedDay(null);
          setPendingDelete(tx);
        }}
        onAdd={(dateKey) => {
          setSelectedDay(null);
          openCreate(dateKey);
        }}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” will be removed. You can undo right after.
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

      <AlertDialog
        open={pendingRecurringDelete !== null}
        onOpenChange={(open) => !open && setPendingRecurringDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this recurring entry?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingRecurringDelete?.title}” will stop generating transactions. Existing
              transactions are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRecurringDelete) recurring.deleteMutation.mutate(pendingRecurringDelete.id);
                setPendingRecurringDelete(null);
              }}
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

export default TransactionsPage;
