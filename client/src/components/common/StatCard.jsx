import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import Card from "./Card";
import { cn } from "./cn";
import { formatCurrency, formatNumber, formatPercent } from "../../services/format";

const formatValue = (value, format) => {
  if (format === "currency") return formatCurrency(value, { compact: value >= 100000 });
  if (format === "percent") return `${value}%`;
  return formatNumber(value);
};

function StatCard({ stat, icon: Icon, index = 0 }) {
  const up = stat.trend === "up";
  const sparkData = stat.spark?.map((v, i) => ({ i, v }));
  const strokeColor = up ? "var(--color-success)" : "var(--color-danger)";

  return (
    <Card
      hover
      padding="p-5"
      className="animate-fade-up"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
          )}
          <span className="text-sm font-medium text-muted">{stat.label}</span>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
            up ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
          )}
        >
          {up ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {formatPercent(stat.delta)}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[26px] font-bold leading-none tracking-tight text-foreground">
            {formatValue(stat.value, stat.format)}
          </p>
          <p className="mt-2 text-xs text-subtle">{stat.caption}</p>
        </div>

        {sparkData && (
          <div className="h-11 w-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id={`spark-${stat.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fill={`url(#spark-${stat.id})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatCard;
