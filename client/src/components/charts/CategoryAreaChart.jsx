import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { formatNumber } from "../../services/format";

const axisProps = {
  tick: { fontSize: 12, fill: "var(--color-subtle)" },
  tickLine: false,
  axisLine: false,
};

const series = [
  { key: "saas", name: "SaaS", color: "var(--color-primary)" },
  { key: "services", name: "Services", color: "#0ea5e9" },
  { key: "hardware", name: "Hardware", color: "#16a34a" },
];

function CategoryAreaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`cat-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="month" {...axisProps} dy={8} />
        <YAxis {...axisProps} width={52} tickFormatter={(v) => formatNumber(v, { compact: true })} />
        <Tooltip content={<ChartTooltip valueType="currency" />} cursor={{ stroke: "var(--color-border-strong)" }} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stackId="1"
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#cat-${s.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default CategoryAreaChart;
