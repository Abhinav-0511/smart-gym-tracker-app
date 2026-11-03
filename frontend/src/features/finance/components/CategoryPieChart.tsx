import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { ResponsiveChart } from "@/components/ui/responsive-chart";
import { formatCurrency } from "@/features/finance/lib/money";

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--popover-foreground))",
  fontSize: "12px",
};

interface CategoryPieChartProps {
  data: CategorySlice[];
  currency: string;
}

const CategoryPieChart = ({ data, currency }: CategoryPieChartProps) => (
  <ResponsiveChart>
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        innerRadius="58%"
        outerRadius="86%"
        paddingAngle={2}
        stroke="none"
      >
        {data.map((slice) => (
          <Cell key={slice.name} fill={slice.color} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={tooltipStyle}
        formatter={(value, name) => [formatCurrency(Number(value), currency), name]}
      />
    </PieChart>
  </ResponsiveChart>
);

export default CategoryPieChart;
