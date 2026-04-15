import GlassCard from "@/components/GlassCard";
import { progressData } from "@/data/mockData";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const tooltipStyle = {
  background: "hsl(0,0%,8%)",
  border: "1px solid hsl(0,0%,16%)",
  borderRadius: "12px",
  color: "hsl(0,0%,95%)",
  fontSize: "12px",
};

const ProgressPage = () => (
  <div className="space-y-5 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Progress</h1>
      <p className="text-sm text-muted-foreground">Track your fitness journey</p>
    </div>

    {/* Body Weight */}
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Body Weight</h3>
        <span className="text-xs text-primary font-medium">-2.5 kg</span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={progressData.weight}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(200, 100%, 55%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(200, 100%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="weight" stroke="hsl(200, 100%, 55%)" fill="url(#weightGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>

    {/* Strength */}
    <GlassCard>
      <h3 className="font-semibold text-foreground mb-4">Strength Progress</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={progressData.strength}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,16%)" />
            <XAxis dataKey="week" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="bench" stroke="hsl(142, 100%, 60%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="squat" stroke="hsl(200, 100%, 55%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="deadlift" stroke="hsl(45, 100%, 60%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Bench</span>
        <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-accent" /> Squat</span>
        <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(45,100%,60%)" }} /> Deadlift</span>
      </div>
    </GlassCard>

    {/* Consistency */}
    <GlassCard>
      <h3 className="font-semibold text-foreground mb-4">Workout Consistency</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={progressData.consistency}>
            <XAxis dataKey="week" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="workouts" fill="hsl(142, 100%, 60%)" radius={[6, 6, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  </div>
);

export default ProgressPage;
