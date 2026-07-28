import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import { Skeleton } from "../../components/common/Loader";
import RevenueChart from "../../components/charts/RevenueChart";
import SalesChart from "../../components/charts/SalesChart";
import TrafficChart from "../../components/charts/TrafficChart";
import CategoryAreaChart from "../../components/charts/CategoryAreaChart";
import { getDashboardData } from "../../services/analyticsService";
import { formatCurrency, formatNumber } from "../../services/format";
import { useAuth } from "../../context/AuthContext";

const RANGES = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "12m", label: "12M" },
];

function Dashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(() => {
      if (!active) return;
      setData(getDashboardData(range));
      setLoading(false);
    }, 550);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [range, nonce]);

  const firstName = useMemo(
    () => (user?.fullName || "there").split(" ")[0],
    [user]
  );

  const kpis = data?.kpis;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Here's what's happening across your business today."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-border bg-elevated p-1">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    range === r.key
                      ? "bg-primary text-white shadow-soft"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setNonce((n) => n + 1)}
              aria-label="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !kpis ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px]" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Revenue"
              value={formatCurrency(kpis.revenue.value)}
              delta={kpis.revenue.delta}
              icon={DollarSign}
              tone="primary"
              spark={kpis.revenue.spark}
            />
            <StatCard
              label="Orders"
              value={formatNumber(kpis.orders.value)}
              delta={kpis.orders.delta}
              icon={ShoppingCart}
              tone="success"
              spark={kpis.orders.spark}
            />
            <StatCard
              label="Active Customers"
              value={formatNumber(kpis.customers.value)}
              delta={kpis.customers.delta}
              icon={Users}
              tone="info"
              spark={kpis.customers.spark}
            />
            <StatCard
              label="Conversion Rate"
              value={`${kpis.conversion.value}%`}
              delta={kpis.conversion.delta}
              icon={TrendingUp}
              tone="warning"
              spark={kpis.conversion.spark}
            />
          </>
        )}
      </div>

      {/* Revenue + traffic */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="lg">
          <Card.Header
            title="Revenue vs. Target"
            subtitle="Daily revenue trend for the selected period"
            action={<Badge tone="success">On track</Badge>}
          />
          {loading || !data ? (
            <Skeleton className="mt-4 h-[300px]" />
          ) : (
            <RevenueChart data={data.revenueSeries} />
          )}
        </Card>

        <Card padding="lg">
          <Card.Header
            title="Traffic Sources"
            subtitle="Where your visitors come from"
          />
          {loading || !data ? (
            <Skeleton className="mt-4 h-[300px]" />
          ) : (
            <TrafficChart data={data.traffic} />
          )}
        </Card>
      </div>

      {/* Sales + category */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card padding="lg">
          <Card.Header
            title="Sales by Channel"
            subtitle="Units sold across sales channels"
          />
          {loading || !data ? (
            <Skeleton className="mt-4 h-[280px]" />
          ) : (
            <SalesChart data={data.channels} />
          )}
        </Card>

        <Card padding="lg">
          <Card.Header
            title="Category Performance"
            subtitle="Revenue contribution by category"
          />
          {loading || !data ? (
            <Skeleton className="mt-4 h-[280px]" />
          ) : (
            <CategoryAreaChart data={data.categorySeries} />
          )}
        </Card>
      </div>

      {/* Top products */}
      <Card padding="lg">
        <Card.Header
          title="Top Products"
          subtitle="Best performers by revenue this period"
          action={
            <Button variant="ghost" size="sm" iconRight={ArrowUpRight}>
              View all
            </Button>
          }
        />
        <div className="mt-2 overflow-x-auto">
          {loading || !data ? (
            <Skeleton className="h-64" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-subtle">
                  <th className="pb-3 pr-4 font-semibold">Product</th>
                  <th className="pb-3 pr-4 font-semibold">Category</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Units</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Revenue</th>
                  <th className="pb-3 text-right font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr
                    key={p.name}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-3 pr-4 font-semibold text-foreground">
                      {p.name}
                    </td>
                    <td className="py-3 pr-4 text-muted">{p.category}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                      {formatNumber(p.units)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums font-semibold text-foreground">
                      {formatCurrency(p.revenue)}
                    </td>
                    <td className="py-3 text-right">
                      <Badge tone={p.delta >= 0 ? "success" : "danger"}>
                        {p.delta >= 0 ? "+" : ""}
                        {p.delta}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
