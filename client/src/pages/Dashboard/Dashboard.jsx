import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  ShoppingCart,
  WalletCards,
  TrendingUp,
  ArrowUpRight,
  Upload,
  FileText,
  Plus,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/common/StatCard";
import PageHeader from "../../components/common/PageHeader";
import Badge from "../../components/common/Badge";
import PageSkeleton from "../../components/common/PageSkeleton";
import api from "../../api/axios";

function Dashboard() {
  const nav = useNavigate();
  const [period, setPeriod] = useState("12");
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    const token = localStorage.getItem("token");
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    setLoading(true);
    try {
      const [ordersRes, analyticsRes] = await Promise.all([
        api.get("/orders", headers),
        api.get("/datasets/active/analytics", headers),
      ]);
      setOrders(ordersRes.data.orders || []);
      setAnalytics(analyticsRes.data.analytics);
    } catch {
      setOrders([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const onRefresh = () => refreshData();
    window.addEventListener("focus", onRefresh);
    window.addEventListener("dataset:updated", onRefresh);
    return () => {
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("dataset:updated", onRefresh);
    };
  }, [refreshData]);

  const chartData = useMemo(() => {
    const source = analytics?.chartData || [];
    return period === "all" ? source : source.slice(-Number(period));
  }, [analytics, period]);

  const go = (category) => nav(`/reports?category=${encodeURIComponent(category)}`);

  const updateOrder = async (id) => {
    const token = localStorage.getItem("token");
    await api.patch(
      `/orders/${id}/status`,
      { status: "Paid" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, status: "Paid" } : order)),
    );
  };

  const summary = analytics?.summary || {};
  const insights = analytics?.insights || [];

  if (loading) {
    return (
      <DashboardLayout>
        <PageSkeleton rows={4} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Overview"
        title="Performance at a glance"
        description="Track what is happening across your business today."
        action={
          <button
            onClick={() => go("Revenue")}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-200"
          >
            View live report <ArrowUpRight className="inline ml-1" size={16} />
          </button>
        }
      />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          onClick={() => go("Revenue")}
          label="Total revenue"
          value={loading ? "—" : `₹${Number(summary.totalRevenue || 0).toLocaleString("en-IN")}`}
          change={summary.growth ? `${summary.growth.toFixed(1)}%` : "0%"}
          icon={WalletCards}
        />
        <StatCard
          onClick={() => go("Sales")}
          label="Total orders"
          value={loading ? "—" : (summary.totalOrders || 0).toLocaleString("en-IN")}
          change="Live"
          icon={ShoppingCart}
          tone="violet"
        />
        <StatCard
          onClick={() => go("Customers")}
          label="Active customers"
          value={loading ? "—" : (summary.activeCustomers || 0).toLocaleString("en-IN")}
          change="Live"
          icon={Users}
          tone="emerald"
        />
        <StatCard
          onClick={() => go("Growth")}
          label="Revenue growth"
          value={loading ? "—" : `${(summary.growth || 0).toFixed(1)}%`}
          change="Live"
          icon={TrendingUp}
          tone="amber"
        />
      </section>
      <section className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-3">
        <article className="surface p-5 xl:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold">Revenue performance</h3>
              <p className="mt-1 text-xs text-slate-500">
                {analytics?.summary?.datasetName ? `Using ${analytics.summary.datasetName}` : "Monthly recurring revenue in thousands"}
              </p>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="form-input w-auto text-xs py-2"
              aria-label="Revenue period"
            >
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
              <option value="24">Last 24 months</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div className="h-75 mt-5">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity=".25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="m"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#revenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="surface p-5">
          <h3 className="font-bold">Business insights</h3>
          <p className="mt-1 text-xs text-slate-500">
            Generated from the active dataset
          </p>
          <div className="mt-5 space-y-4">
            {insights.length ? insights.map((insight, index) => (
              <div key={`${insight.title}-${index}`} className={`rounded-xl p-4 ${insight.tone === "green" ? "bg-emerald-50" : insight.tone === "violet" ? "bg-violet-50" : insight.tone === "amber" ? "bg-amber-50" : "bg-blue-50"}`}>
                <Badge tone={insight.tone === "green" ? "green" : insight.tone === "amber" ? "amber" : insight.tone === "violet" ? "violet" : "blue"}>{insight.tone === "green" ? "Opportunity" : insight.tone === "amber" ? "Monitor" : insight.tone === "violet" ? "Priority" : "Signal"}</Badge>
                <p className="mt-2 text-sm font-semibold">{insight.title}</p>
                <p className="mt-1 text-xs text-slate-600">{insight.detail}</p>
              </div>
            )) : <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Upload a dataset to generate insights.</div>}
          </div>
        </article>
      </section>
      <section className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-3">
        <article className="surface p-5 xl:col-span-2">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold">Latest orders</h3>
              <p className="mt-1 text-xs text-slate-500">
                {summary.lastUpdated ? `Last updated ${new Date(summary.lastUpdated).toLocaleString("en-IN")}` : "Change an order from unpaid or pending to paid."}
              </p>
            </div>
            <button
              onClick={() => go("Sales")}
              className="text-sm font-semibold text-blue-600"
            >
              View all
            </button>
          </div>
          <div className="table-wrap mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((x) => (
                  <tr key={x.id}>
                    <td className="font-semibold">{x.customerName}</td>
                    <td>{x.product}</td>
                    <td>₹{Number(x.amount).toLocaleString("en-IN")}</td>
                    <td>
                      <Badge tone={x.status === "Paid" ? "green" : "amber"}>
                        {x.status}
                      </Badge>
                    </td>
                    <td>
                      {x.status !== "Paid" && (
                        <button
                          onClick={() => updateOrder(x.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          Mark as paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="surface p-5">
          <h3 className="font-bold">Quick actions</h3>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => nav("/upload")}
              className="w-full flex gap-3 items-center rounded-xl bg-blue-50 p-3 text-left text-sm font-semibold text-blue-700"
            >
              <Upload size={17} /> Upload a dataset
            </button>
            <button
              onClick={() => nav("/reports")}
              className="w-full flex gap-3 items-center rounded-xl p-3 text-left text-sm font-semibold hover:bg-slate-50"
            >
              <FileText size={17} /> Generate report
            </button>
            <button
              onClick={() => nav("/forecast")}
              className="w-full flex gap-3 items-center rounded-xl p-3 text-left text-sm font-semibold hover:bg-slate-50"
            >
              <Plus size={17} /> Explore forecast
            </button>
          </div>
        </article>
      </section>
    </DashboardLayout>
  );
}
export default Dashboard;
