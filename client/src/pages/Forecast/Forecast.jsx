import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles, TrendingUp, Target, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import api from "../../api/axios";
function Forecast() {
  const [analytics, setAnalytics] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    const loadForecast = () => {
      api.get("/datasets/active/analytics", headers)
        .then((response) => setAnalytics(response.data.analytics))
        .catch(() => setAnalytics(null));
    };
    loadForecast();
    window.addEventListener("focus", loadForecast);
    window.addEventListener("dataset:updated", loadForecast);
    return () => {
      window.removeEventListener("focus", loadForecast);
      window.removeEventListener("dataset:updated", loadForecast);
    };
  }, []);
  const data = analytics?.forecastData || [];
  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Predictive analytics"
        title="Plan ahead with confidence"
        description="A revenue outlook based on your historical sales performance."
        action={
          <select className="form-input w-auto text-sm">
            <option>Next 6 months</option>
            <option>Next 12 months</option>
          </select>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Forecasted revenue"
          value={analytics ? `₹${(analytics.summary?.totalRevenue || 0).toLocaleString("en-IN")}` : "—"}
          change="Live"
          icon={TrendingUp}
        />
        <StatCard
          label="Projected growth"
          value={analytics ? `${(analytics.summary?.growth || 0).toFixed(1)}%` : "—"}
          change="Live"
          icon={Target}
          tone="violet"
        />
        <StatCard
          label="Confidence score"
          value={analytics ? `${Math.max(70, 90 - (analytics.summary?.rowCount || 0) / 100)}%` : "—"}
          change="Live"
          icon={ShieldCheck}
          tone="emerald"
        />
        <StatCard
          label="Trend strength"
          value={analytics?.summary?.rowCount ? "Strong" : "—"}
          change="Live"
          icon={Sparkles}
          tone="amber"
        />
      </section>
      <section className="grid gap-5 mt-5 xl:grid-cols-3">
        <article className="surface p-5 xl:col-span-2">
          <h3 className="font-bold">Revenue forecast</h3>
          <p className="mt-1 text-xs text-slate-500">
            Actual revenue through October · projected performance thereafter
          </p>
          <div className="h-80 mt-4">
            <ResponsiveContainer>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="forecast" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#7c3aed" stopOpacity=".25" />
                    <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Area
                  dataKey="value"
                  type="monotone"
                  stroke="#2563eb"
                  fill="none"
                  strokeWidth={3}
                />
                <Area
                  dataKey="forecast"
                  type="monotone"
                  stroke="#7c3aed"
                  fill="url(#forecast)"
                  strokeWidth={3}
                  strokeDasharray="6 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <aside className="surface p-5">
          <h3 className="font-bold">Model summary</h3>
          <div className="mt-5 space-y-5 text-sm">
            <div>
              <p className="font-semibold">Growing demand</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Revenue is predicted to maintain a positive trajectory through
                the next period.
              </p>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="font-semibold">Seasonal peak</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Plan capacity for the expected year-end increase in December.
              </p>
            </div>
            <div className="rounded-xl bg-violet-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                Recommendation
              </p>
              <p className="mt-2 text-sm font-semibold">
                Increase growth campaign budget before November.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </DashboardLayout>
  );
}
export default Forecast;
