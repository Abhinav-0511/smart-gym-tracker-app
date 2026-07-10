import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency, formatCurrency } from "@/features/finance/lib/money";

export interface IncomeExpensePoint {
  label: string;
  income: number;
  expense: number;
}

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--popover-foreground))",
  fontSize: "12px",
};

interface IncomeExpenseChartProps {
  data: IncomeExpensePoint[];
  currency: string;
}

/** Grouped income vs expense bars, used for the monthly comparison. */
const IncomeExpenseChart = ({ data, currency }: IncomeExpenseChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        interval="preserveStartEnd"
        minTickGap={16}
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
        cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
        formatter={(value, name) => [formatCurrency(Number(value), currency), name]}
      />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
      <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={28} />
    </BarChart>
  </ResponsiveContainer>
);

export default IncomeExpenseChart;
