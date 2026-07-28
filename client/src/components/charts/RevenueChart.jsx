import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { formatNumber } from "../../services/format";

const axisProps = {
  stroke: "var(--color-subtle)",
  tick: { fontSize: 12, fill: "var(--color-subtle)" },
  tickLine: false,
  axisLine: false,
};

function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="month" {...axisProps} dy={8} />
        <YAxis
          {...axisProps}
          width={52}
          tickFormatter={(v) => formatNumber(v, { compact: true })}
        />
        <Tooltip content={<ChartTooltip valueType="currency" />} cursor={{ stroke: "var(--color-border-strong)" }} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          fill="url(#revenueFill)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-card)" }}
        />
        <Line
          type="monotone"
          dataKey="target"
          name="Target"
          stroke="var(--color-subtle)"
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default RevenueChart;
