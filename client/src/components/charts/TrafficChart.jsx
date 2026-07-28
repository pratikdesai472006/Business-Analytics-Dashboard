import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

function TrafficTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-border bg-elevated px-3.5 py-2 shadow-lift">
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full" style={{ background: item.payload.color }} />
        <span className="text-muted">{item.name}</span>
        <span className="ml-2 font-semibold text-foreground">{item.value}%</span>
      </div>
    </div>
  );
}

function TrafficChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-[176px] w-[176px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<TrafficTooltip />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-subtle">Sessions</span>
          <span className="text-xl font-bold text-foreground">{total}%</span>
        </div>
      </div>

      <ul className="grid w-full flex-1 grid-cols-1 gap-2.5">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted">{entry.name}</span>
            <span className="ml-auto font-semibold text-foreground">{entry.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TrafficChart;
