import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Edit3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import GlassCard from "@/components/GlassCard";
import ManualPRDialog from "@/components/prs/ManualPRDialog";
import { Button } from "@/components/ui/button";
import PageSkeleton from "@/components/ui/page-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePersonalRecords } from "@/hooks/usePersonalRecords";
import {
  buildPRChartData,
  type ManualPRInput,
  type PersonalRecord,
} from "@/types/personal-record";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--popover-foreground))",
};

const PRsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PersonalRecord | null>(null);
  const {
    recordsQuery,
    historyQuery,
    completedSetsQuery,
    detectMutation,
    createMutation,
    updateMutation,
    deleteMutation,
  } = usePersonalRecords(user?.id, selectedExerciseId);

  const data = recordsQuery.data;
  const selectedExerciseName =
    data?.catalog.find((exercise) => exercise.id === selectedExerciseId)?.name
    ?? "Exercise";

  useEffect(() => {
    if (selectedExerciseId) return;

    const latestHistoryPoint = completedSetsQuery.data?.at(-1);
    if (latestHistoryPoint) {
      setSelectedExerciseId(latestHistoryPoint.exerciseId);
    } else if (data?.lifetimeBests.length) {
      setSelectedExerciseId(data.lifetimeBests[0].exerciseId);
    }
  }, [completedSetsQuery.data, data?.lifetimeBests, selectedExerciseId]);

  const chartData = useMemo(
    () => buildPRChartData(historyQuery.data ?? []),
    [historyQuery.data],
  );

  const handleSave = async (input: ManualPRInput) => {
    if (editingRecord) {
      await updateMutation.mutateAsync({ recordId: editingRecord.id, input });
    } else {
      await createMutation.mutateAsync(input);
    }
    toast({ title: editingRecord ? "PR updated" : "Manual PR added" });
  };

  if (recordsQuery.isPending) {
    return <PageSkeleton label="Loading personal records" variant="analytics" />;
  }

  if (recordsQuery.isError) {
    return (
      <GlassCard className="text-center py-8">
        <AlertCircle className="text-destructive mx-auto mb-3" />
        <p className="font-semibold text-foreground">Couldn’t load personal records</p>
        <p className="text-sm text-muted-foreground mt-1">{recordsQuery.error.message}</p>
        <Button className="mt-4" onClick={() => void recordsQuery.refetch()}>
          <RefreshCw size={16} />
          Retry
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Personal Records</h1>
          <p className="text-sm text-muted-foreground">
            {data?.records.length ?? 0} records tracked
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingRecord(null);
            setDialogOpen(true);
          }}
        >
          <Plus size={14} />
          Add PR
        </Button>
      </div>

      {data?.lifetimeBests.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {data.lifetimeBests.slice(0, 3).map((record) => (
            <GlassCard
              key={record.exerciseId}
              hover
              className="text-left"
              onClick={() => setSelectedExerciseId(record.exerciseId)}
            >
              <Trophy size={20} className="mb-3 text-primary" />
              <h3 className="font-medium text-foreground">{record.exerciseName}</h3>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{record.weightKg}kg</p>
              {record.previousWeightKg !== null && record.weightKg > record.previousWeightKg && (
                <span className="mt-1 flex items-center gap-1 text-xs text-primary">
                  <ArrowUpRight size={12} />
                  +{(record.weightKg - record.previousWeightKg).toFixed(1)}kg
                </span>
              )}
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-8">
          <Trophy className="text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">No personal records yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete a workout or add a manual record to begin.
          </p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => {
              setEditingRecord(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={14} />
            Add Manual PR
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            disabled={detectMutation.isPending}
            onClick={() =>
              detectMutation.mutate(undefined, {
                onError: (error) =>
                  toast({
                    variant: "destructive",
                    title: "Couldn’t check completed workouts",
                    description: error instanceof Error ? error.message : "Please try again.",
                  }),
              })
            }
          >
            <RefreshCw size={14} />
            Check Completed Workouts
          </Button>
        </GlassCard>
      )}

      <GlassCard>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-foreground">
            {selectedExerciseName} History
          </h3>
          {data?.lifetimeBests.length ? (
            <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
              <SelectTrigger className="w-40" aria-label="Chart exercise">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.lifetimeBests.map((record) => (
                  <SelectItem key={record.exerciseId} value={record.exerciseId}>
                    {record.exerciseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
        <div className="h-48">
          {historyQuery.isPending ? (
            <div className="h-full flex items-center justify-center">
              <LoaderCircle className="animate-spin text-primary" />
            </div>
          ) : chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" fill="url(#prGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No completed-set history for this exercise.
            </div>
          )}
        </div>
      </GlassCard>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Completed Set History</h3>
        {completedSetsQuery.isPending ? (
          <GlassCard className="flex items-center justify-center py-8">
            <LoaderCircle className="animate-spin text-primary" />
          </GlassCard>
        ) : completedSetsQuery.data?.length ? (
          <div className="space-y-2">
            {[...completedSetsQuery.data].reverse().slice(0, 8).map((point) => (
              <GlassCard key={point.sessionSetId}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {point.exerciseName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {point.workoutDate} · {point.reps} reps
                    </p>
                  </div>
                  <p className="font-bold text-foreground">{point.weightKg}kg</p>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="text-center text-sm text-muted-foreground">
            Complete weighted sets to build workout history.
          </GlassCard>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">PR Timeline</h3>
        <div className="space-y-2">
          {data?.records.map((record) => (
            <GlassCard key={record.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{record.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">{record.achievedOn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-bold text-foreground">{record.weightKg}kg</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      record.source === "auto"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent"
                    }`}>
                      {record.source}
                    </span>
                  </div>
                  {record.source === "manual" && (
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingRecord(record);
                          setDialogOpen(true);
                        }}
                        aria-label={`Edit ${record.exerciseName} PR`}
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm("Delete this manual personal record?")) {
                            deleteMutation.mutate(record.id, {
                              onError: (error) =>
                                toast({
                                  variant: "destructive",
                                  title: "Couldn’t delete PR",
                                  description: error instanceof Error ? error.message : "Please try again.",
                                }),
                            });
                          }
                        }}
                        aria-label={`Delete ${record.exerciseName} PR`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
          {!data?.records.length && (
            <GlassCard className="text-center text-sm text-muted-foreground">
              Your PR timeline is empty.
            </GlassCard>
          )}
        </div>
      </div>

      <ManualPRDialog
        open={dialogOpen}
        catalog={data?.catalog ?? []}
        record={editingRecord}
        saving={createMutation.isPending || updateMutation.isPending}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </div>
  );
};

export default PRsPage;
