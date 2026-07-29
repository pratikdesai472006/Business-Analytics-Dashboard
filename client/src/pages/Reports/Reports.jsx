import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, FileText, Search, SlidersHorizontal, X } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PageHeader from "../../components/common/PageHeader";
import Badge from "../../components/common/Badge";
import PageSkeleton from "../../components/common/PageSkeleton";
import { fetchActiveAnalytics } from "../../utils/analyticsCache";
import api from "../../api/axios";

function Reports() {
  const [query, setQuery] = useState(""),
    [params, setParams] = useSearchParams(),
    [reports, setReports] = useState([]),
    [creating, setCreating] = useState(false),
    [loading, setLoading] = useState(true),
    [draft, setDraft] = useState({
      name: "",
      category: "Revenue",
      period: "This month",
    });
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    const loadReports = async () => {
      setLoading(true);
      try {
        const response = await fetchActiveAnalytics(api, headers);
        setReports(response.data?.reports || []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
    window.addEventListener("focus", loadReports);
    window.addEventListener("dataset:updated", loadReports);
    return () => {
      window.removeEventListener("focus", loadReports);
      window.removeEventListener("dataset:updated", loadReports);
    };
  }, []);
  const category = params.get("category") || "All";
  const shown = useMemo(
    () =>
      reports.filter(
        (r) =>
          (r.name || "").toLowerCase().includes(query.toLowerCase()) &&
          (category === "All" || r.category === category),
      ),
    [query, category, reports],
  );
  const exportFile = (report) => {
    const blob = new Blob(
      [`Report,Category,Period,Status\n${[report.name, report.category, report.period, report.status].join(",")}`],
      { type: "text/csv" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${report.name.toLowerCase().replaceAll(" ", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const create = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setReports([
      { name: draft.name, category: draft.category, period: draft.period, updated: "Just now", status: "Draft" },
      ...reports,
    ]);
    setCreating(false);
    setDraft({ name: "", category: "Revenue", period: "This month" });
    setParams({ category: draft.category });
  };
  const setCategory = (value) =>
    setParams(value === "All" ? {} : { category: value });

  if (loading) {
    return (
      <DashboardLayout>
        <PageSkeleton rows={3} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Report center"
        title={
          category === "All"
            ? "Reports that answer questions"
            : `${category} reports`
        }
        description={
          category === "All"
            ? "Explore the metrics behind your business decisions."
            : `Showing reports related to ${category.toLowerCase()}.`
        }
        action={
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white"
          >
            Create report
          </button>
        }
      />
      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <form
            onSubmit={create}
            className="surface w-full max-w-md p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">Create a report</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Save a report configuration to your workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="icon-button"
              >
                <X size={16} />
              </button>
            </div>
            <label className="mt-5 block text-sm font-semibold">
              Report name
              <input
                autoFocus
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="form-input mt-2 font-normal"
                placeholder="e.g. Weekly revenue review"
              />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Category
                <select
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                  className="form-input mt-2 font-normal"
                >
                  <option>Revenue</option>
                  <option>Sales</option>
                  <option>Customers</option>
                  <option>Growth</option>
                </select>
              </label>
              <label className="text-sm font-semibold">
                Period
                <select
                  value={draft.period}
                  onChange={(e) =>
                    setDraft({ ...draft, period: e.target.value })
                  }
                  className="form-input mt-2 font-normal"
                >
                  <option>This month</option>
                  <option>Last quarter</option>
                  <option>Year to date</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                Create report
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="surface">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-input pl-9 sm:w-72"
              placeholder="Search reports"
            />
          </label>
          <div className="flex gap-2">
            <button className="icon-button" aria-label="Filter">
              <SlidersHorizontal size={17} />
            </button>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input w-auto text-sm"
            >
              <option value="All">All categories</option>
              <option>Revenue</option>
              <option>Sales</option>
              <option>Customers</option>
              <option>Growth</option>
              <option>Products</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Category</th>
                <th>Period</th>
                <th>Updated</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={`${r.name}-${r.updated}`}>
                  <td>
                    <span className="flex items-center gap-3 font-semibold">
                      <span className="grid place-items-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
                        <FileText size={16} />
                      </span>
                      {r.name}
                    </span>
                  </td>
                  <td>{r.category}</td>
                  <td>{r.period}</td>
                  <td>{r.updated}</td>
                  <td>
                    <Badge tone={r.status === "Ready" ? "green" : "amber"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td>
                    <button
                      onClick={() => exportFile(r)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600"
                    >
                      <Download size={15} /> Export
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t border-slate-100 p-4 text-xs text-slate-500">
          <span>
            Showing {shown.length} of {reports.length} reports
          </span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
export default Reports;
