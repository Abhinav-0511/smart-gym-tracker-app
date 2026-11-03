import { useMemo, useState } from "react";
import { Plus, Target } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
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
import AdjustFundsDialog from "@/features/finance/components/AdjustFundsDialog";
import SavingsGoalCard from "@/features/finance/components/SavingsGoalCard";
import SavingsGoalFormDialog from "@/features/finance/components/SavingsGoalFormDialog";
import StatCard from "@/features/finance/components/StatCard";
import { useSavingsGoals } from "@/features/finance/hooks/useSavingsGoals";
import { getLocalDateString } from "@/types/dashboard";
import { formatCurrency } from "@/features/finance/lib/money";
import { DEFAULT_CURRENCY } from "@/features/finance/types/common";
import type {
  CreateSavingsGoalInput,
  SavingsGoal,
} from "@/features/finance/types/savings";

const GoalsPage = () => {
  const { user, profile } = useAuth();
  const timezone = profile?.timezone ?? "UTC";
  const currency = DEFAULT_CURRENCY;
  const todayKey = getLocalDateString(new Date(), timezone);
  const { toast } = useToast();

  const { goalsQuery, createMutation, updateMutation, adjustMutation, deleteMutation } =
    useSavingsGoals(user?.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [fundsGoal, setFundsGoal] = useState<SavingsGoal | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavingsGoal | null>(null);

  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);

  const totals = useMemo(() => {
    const active = goals.filter((goal) => goal.status !== "archived");
    return {
      saved: active.reduce((sum, goal) => sum + goal.currentAmount, 0),
      target: active.reduce((sum, goal) => sum + goal.targetAmount, 0),
      count: active.length,
    };
  }, [goals]);

  const handleSubmit = async (input: CreateSavingsGoalInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, input });
      toast({ title: "Goal updated" });
    } else {
      await createMutation.mutateAsync(input);
      toast({ title: "Goal created" });
    }
  };

  const handleAdjust = async (delta: number) => {
    if (!fundsGoal) return;
    await adjustMutation.mutateAsync({ goal: fundsGoal, delta });
    toast({ title: delta >= 0 ? "Funds added" : "Funds withdrawn" });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Saved" value={formatCurrency(totals.saved, currency)} icon={Target} tone="text-emerald-500" />
        <StatCard label="Target" value={formatCurrency(totals.target, currency)} icon={Target} />
        <StatCard label="Goals" value={String(totals.count)} icon={Target} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Your goals</h3>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={18} /> New Goal
        </Button>
      </div>

      {goalsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Target size={24} />
          </div>
          <h3 className="text-base font-bold text-foreground">No savings goals yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Set a goal — an emergency fund, a trip, a new phone — and watch it grow.
          </p>
          <Button
            className="mt-1"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={18} /> New Goal
          </Button>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              currency={currency}
              todayKey={todayKey}
              onAddFunds={setFundsGoal}
              onEdit={(item) => {
                setEditing(item);
                setFormOpen(true);
              }}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <SavingsGoalFormDialog
        open={formOpen}
        goal={editing}
        saving={createMutation.isPending || updateMutation.isPending}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <AdjustFundsDialog
        open={fundsGoal !== null}
        goal={fundsGoal}
        currency={currency}
        saving={adjustMutation.isPending}
        onOpenChange={(open) => !open && setFundsGoal(null)}
        onSubmit={handleAdjust}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.name}” and its saved progress will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
                setPendingDelete(null);
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

export default GoalsPage;
