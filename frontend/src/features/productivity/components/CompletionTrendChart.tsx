import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ResponsiveChart } from "@/components/ui/responsive-chart";
import type { TrendPoint } from "@/features/productivity/lib/reports";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--popover-foreground))",
  fontSize: "12px",
};

interface CompletionTrendChartProps {
  data: TrendPoint[];
}

const CompletionTrendChart = ({ data }: CompletionTrendChartProps) => (
  <ResponsiveChart>
    <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
      <defs>
        <linearGradient id="habitTrendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.24} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="taskTrendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        interval="preserveStartEnd"
        minTickGap={24}
      />
      <YAxis
        allowDecimals={false}
        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={32}
      />
      <Tooltip contentStyle={tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      <Area
        type="monotone"
        dataKey="habits"
        name="Habits"
        stroke="hsl(var(--primary))"
        fill="url(#habitTrendGrad)"
        strokeWidth={2}
      />
      <Area
        type="monotone"
        dataKey="tasks"
        name="Tasks"
        stroke="#f97316"
        fill="url(#taskTrendGrad)"
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveChart>
);

export default CompletionTrendChart;
