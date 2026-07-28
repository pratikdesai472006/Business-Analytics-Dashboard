import {
  Bar,
  BarChart,
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

function SalesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="day" {...axisProps} dy={8} />
        <YAxis {...axisProps} width={44} tickFormatter={(v) => formatNumber(v, { compact: true })} />
        <Tooltip
          content={<ChartTooltip valueType="number" />}
          cursor={{ fill: "var(--color-primary)", fillOpacity: 0.06 }}
        />
        <Bar dataKey="online" name="Online" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={26} />
        <Bar dataKey="retail" name="Retail" fill="var(--color-accent)" fillOpacity={0.45} radius={[6, 6, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default SalesChart;
