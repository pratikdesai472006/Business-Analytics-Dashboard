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
import { formatCurrency, formatNumber } from "../../services/format";

const axisProps = {
  tick: { fontSize: 12, fill: "var(--color-subtle)" },
  tickLine: false,
  axisLine: false,
};

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-elevated px-3.5 py-2.5 shadow-lift">
      <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>
      {row.actual != null && (
        <p className="text-xs text-muted">
          Actual <span className="ml-2 font-semibold text-foreground">{formatCurrency(row.actual)}</span>
        </p>
      )}
      {row.predicted != null && (
        <>
          <p className="text-xs text-muted">
            Predicted <span className="ml-2 font-semibold text-primary">{formatCurrency(row.predicted)}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-subtle">
            Range {formatCurrency(row.range[0])} – {formatCurrency(row.range[1])}
          </p>
        </>
      )}
    </div>
  );
}

function ForecastChart({ history, forecast }) {
  const bridge = history[history.length - 1];

  const data = [
    ...history.map((h) => ({ month: h.month, actual: h.actual })),
    // Bridge point so the predicted line connects to history smoothly.
    { month: bridge.month, predicted: bridge.actual, range: [bridge.actual, bridge.actual] },
    ...forecast.map((f) => ({
      month: f.month,
      predicted: f.predicted,
      range: [f.lower, f.upper],
    })),
  ];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="month" {...axisProps} dy={8} interval="preserveStartEnd" />
        <YAxis {...axisProps} width={52} tickFormatter={(v) => formatNumber(v, { compact: true })} />
        <Tooltip content={<ForecastTooltip />} cursor={{ stroke: "var(--color-border-strong)" }} />
        <Area
          type="monotone"
          dataKey="range"
          name="Confidence"
          stroke="none"
          fill="url(#forecastBand)"
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke="var(--color-foreground)"
          strokeWidth={2.5}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="predicted"
          name="Forecast"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          strokeDasharray="6 5"
          dot={{ r: 3, fill: "var(--color-primary)" }}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default ForecastChart;
