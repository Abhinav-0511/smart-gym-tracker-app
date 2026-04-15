import { Trophy, TrendingUp, Plus, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { prRecords } from "@/data/mockData";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const benchData = [
  { month: "Oct", weight: 80 }, { month: "Nov", weight: 85 },
  { month: "Dec", weight: 90 }, { month: "Jan", weight: 92.5 },
  { month: "Feb", weight: 97.5 }, { month: "Mar", weight: 100 },
];

const PRsPage = () => (
  <div className="space-y-5 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Personal Records</h1>
        <p className="text-sm text-muted-foreground">{prRecords.length} records tracked</p>
      </div>
      <Button variant="glass" size="sm">
        <Plus size={14} />
        Add PR
      </Button>
    </div>

    {/* Top 3 PR Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {prRecords.slice(0, 3).map((pr) => (
        <GlassCard key={pr.id} hover className="text-center">
          <Trophy size={24} className="text-primary mx-auto mb-2" />
          <h3 className="font-bold text-foreground">{pr.exercise}</h3>
          <p className="text-2xl font-bold text-gradient mt-1">{pr.weight}kg</p>
          {pr.previousWeight && (
            <span className="text-xs text-primary flex items-center justify-center gap-1 mt-1">
              <ArrowUpRight size={12} />
              +{(pr.weight - pr.previousWeight).toFixed(1)}kg
            </span>
          )}
        </GlassCard>
      ))}
    </div>

    {/* PR Progress Chart */}
    <GlassCard>
      <h3 className="font-semibold text-foreground mb-4">Bench Press Progress</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={benchData}>
            <defs>
              <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 100%, 60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(142, 100%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(0,0%,8%)", border: "1px solid hsl(0,0%,16%)", borderRadius: "12px", color: "hsl(0,0%,95%)" }}
            />
            <Area type="monotone" dataKey="weight" stroke="hsl(142, 100%, 60%)" fill="url(#prGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>

    {/* PR History */}
    <div>
      <h3 className="font-semibold text-foreground mb-3">History</h3>
      <div className="space-y-2">
        {prRecords.map((pr) => (
          <GlassCard key={pr.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{pr.exercise}</p>
                  <p className="text-xs text-muted-foreground">{pr.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{pr.weight}kg</p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  pr.type === "auto" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                }`}>
                  {pr.type}
                </span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  </div>
);

export default PRsPage;
