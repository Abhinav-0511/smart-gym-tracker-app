import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { ResponsiveChart } from "@/components/ui/responsive-chart";
import { formatCompactCurrency, formatCurrency } from "@/features/finance/lib/money";

export interface SpendingPoint {
  label: string;
  value: number;
}

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--popover-foreground))",
  fontSize: "12px",
};

interface SpendingTrendChartProps {
  data: SpendingPoint[];
  currency: string;
  /** Hex colour for the line/area, defaults to the rose "expense" tone. */
  color?: string;
  seriesName?: string;
}

/** Single-series area chart for daily/monthly spending trends. */
const SpendingTrendChart = ({
  data,
  currency,
  color = "#f43f5e",
  seriesName = "Spending",
}: SpendingTrendChartProps) => (
  <ResponsiveChart>
    <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
      <defs>
        <linearGradient id="financeSpendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        interval="preserveStartEnd"
        minTickGap={20}
      />
      <YAxis
        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={44}
        tickFormatter={(value: number) => formatCompactCurrency(value, currency)}
      />
      <Tooltip
        contentStyle={tooltipStyle}
        formatter={(value) => [formatCurrency(Number(value), currency), seriesName]}
      />
      <Area
        type="monotone"
        dataKey="value"
        name={seriesName}
        stroke={color}
        fill="url(#financeSpendGrad)"
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveChart>
);

export default SpendingTrendChart;
