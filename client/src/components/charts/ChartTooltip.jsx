import { formatCurrency, formatNumber } from "../../services/format";

function ChartTooltip({ active, payload, label, valueType = "currency", suffix }) {
  if (!active || !payload?.length) return null;

  const fmt = (v) =>
    valueType === "currency"
      ? formatCurrency(v)
      : `${formatNumber(v)}${suffix || ""}`;

  return (
    <div className="rounded-xl border border-border bg-elevated px-3.5 py-2.5 shadow-lift">
      {label && (
        <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey ?? entry.name}
            className="flex items-center gap-2 text-xs"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: entry.color || entry.stroke || entry.fill }}
            />
            <span className="capitalize text-muted">{entry.name}</span>
            <span className="ml-auto font-semibold text-foreground">
              {fmt(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChartTooltip;
