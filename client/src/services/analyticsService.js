// Deterministic analytics data layer.
//
// The production backend currently only exposes authentication endpoints, so
// this service provides realistic, stable sample analytics that power every
// page. It is intentionally structured like an API client: each function
// returns a resolved Promise so screens can swap to real endpoints later
// without changing their calling code.

const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const rand = mulberry32(20240514);
const between = (min, max) => min + rand() * (max - min);

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const delay = (data, ms = 350) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

/* ---------------------------------------------------------------- KPIs */
const kpis = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: 842530,
    format: "currency",
    delta: 18.2,
    trend: "up",
    caption: "vs. last quarter",
    spark: Array.from({ length: 12 }, (_, i) => 40 + i * 3 + between(-6, 8)),
  },
  {
    id: "orders",
    label: "Orders",
    value: 12480,
    format: "number",
    delta: 9.4,
    trend: "up",
    caption: "vs. last quarter",
    spark: Array.from({ length: 12 }, (_, i) => 30 + i * 2 + between(-5, 6)),
  },
  {
    id: "customers",
    label: "Active Customers",
    value: 6432,
    format: "number",
    delta: 6.1,
    trend: "up",
    caption: "vs. last quarter",
    spark: Array.from({ length: 12 }, (_, i) => 20 + i * 2.5 + between(-4, 5)),
  },
  {
    id: "growth",
    label: "Growth Rate",
    value: 18.6,
    format: "percent",
    delta: -1.3,
    trend: "down",
    caption: "vs. last quarter",
    spark: Array.from({ length: 12 }, (_, i) => 50 + Math.sin(i) * 8 + between(-3, 3)),
  },
];

/* ------------------------------------------------------------ Revenue */
const revenueSeries = MONTHS.map((month, i) => {
  const base = 48000 + i * 4200;
  const revenue = Math.round(base + between(-6000, 9000));
  const target = Math.round(base * 1.02);
  return {
    month,
    revenue,
    target,
    expenses: Math.round(revenue * between(0.52, 0.64)),
  };
});

/* -------------------------------------------------------------- Sales */
const salesSeries = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
  (day, i) => ({
    day,
    online: Math.round(between(1200, 2600) + i * 60),
    retail: Math.round(between(700, 1800) + i * 40),
  })
);

/* ------------------------------------------------------------ Traffic */
const trafficBreakdown = [
  { name: "Direct", value: 38, color: "var(--color-primary)" },
  { name: "Organic Search", value: 27, color: "#0ea5e9" },
  { name: "Referral", value: 18, color: "#16a34a" },
  { name: "Social", value: 11, color: "#f59e0b" },
  { name: "Email", value: 6, color: "#7c3aed" },
];

/* ----------------------------------------------------------- Category */
const categorySeries = MONTHS.map((month, i) => ({
  month,
  saas: Math.round(20000 + i * 1800 + between(-2000, 3000)),
  services: Math.round(14000 + i * 1200 + between(-1800, 2500)),
  hardware: Math.round(9000 + i * 700 + between(-1200, 1800)),
}));

/* ----------------------------------------------------------- Products */
const topProducts = [
  { id: "P-2201", name: "Analytics Pro (Annual)", category: "SaaS", units: 1842, revenue: 221040, growth: 24.1 },
  { id: "P-1180", name: "Team Workspace", category: "SaaS", units: 1520, revenue: 152000, growth: 12.5 },
  { id: "P-3390", name: "Onboarding Package", category: "Services", units: 640, revenue: 96000, growth: 8.2 },
  { id: "P-4402", name: "API Gateway Add-on", category: "SaaS", units: 980, revenue: 78400, growth: -3.4 },
  { id: "P-5510", name: "Data Connector Kit", category: "Hardware", units: 410, revenue: 61500, growth: 15.9 },
];

/* ------------------------------------------------------------- Orders */
const customers = [
  "Amara Okafor", "Liam Chen", "Sofia Rossi", "Noah Patel", "Mia Andersson",
  "Ethan Brooks", "Yuki Tanaka", "Olivia Meyer", "Diego Alvarez", "Hana Kim",
];
const statuses = ["Paid", "Pending", "Refunded", "Failed"];
const recentOrders = Array.from({ length: 8 }, (_, i) => ({
  id: `#ORD-${9021 - i}`,
  customer: customers[i % customers.length],
  amount: Math.round(between(120, 4200)),
  status: statuses[Math.floor(between(0, i === 2 ? 3.9 : 2.4))],
  date: new Date(Date.now() - i * 5.5 * 3600 * 1000).toISOString(),
}));

/* ----------------------------------------------------------- Activity */
const activity = [
  { id: 1, type: "upload", title: "Q2 sales export processed", meta: "4,204 rows • sales_q2.csv", at: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: 2, type: "report", title: "Revenue report generated", meta: "PDF • 8 pages", at: new Date(Date.now() - 95 * 60000).toISOString() },
  { id: 3, type: "forecast", title: "Forecast model refreshed", meta: "Confidence 92%", at: new Date(Date.now() - 3.5 * 3600000).toISOString() },
  { id: 4, type: "customer", title: "312 new customers this week", meta: "+6.1% vs last week", at: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: 5, type: "alert", title: "API Gateway revenue dipped", meta: "-3.4% MoM", at: new Date(Date.now() - 26 * 3600000).toISOString() },
];

/* ----------------------------------------------------------- Insights */
const insights = [
  { id: 1, tone: "success", title: "SaaS revenue is accelerating", body: "Recurring revenue grew 24% QoQ, driven by annual Analytics Pro upgrades." },
  { id: 2, tone: "warning", title: "Refund rate ticking up", body: "Refunds rose to 2.1% of orders. Concentrated in the Hardware category." },
  { id: 3, tone: "info", title: "Best performing channel", body: "Direct traffic converts 2.3x better than social. Consider reallocating spend." },
];

/* ------------------------------------------------------------ Reports */
const reportTypes = ["Revenue", "Sales", "Customers", "Forecast", "Inventory"];
const reportFormats = ["PDF", "Excel", "CSV"];
const reports = Array.from({ length: 24 }, (_, i) => {
  const type = reportTypes[i % reportTypes.length];
  const created = new Date(Date.now() - i * 2.4 * 86400000).toISOString();
  return {
    id: `RPT-${4820 - i}`,
    name: `${type} Report — ${MONTHS[(11 - (i % 12))]} ${2025 - Math.floor(i / 12)}`,
    type,
    format: reportFormats[i % reportFormats.length],
    status: i % 7 === 0 ? "Processing" : "Ready",
    size: Math.round(between(180, 4200)) * 1024,
    records: Math.round(between(800, 12000)),
    createdAt: created,
    owner: customers[i % customers.length],
  };
});

/* ----------------------------------------------------------- Forecast */
const buildForecast = () => {
  const history = MONTHS.map((month, i) => ({
    month,
    actual: Math.round(48000 + i * 4200 + between(-4000, 6000)),
  }));

  const lastValue = history[history.length - 1].actual;
  const growth = 0.052;
  const forecast = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => {
    const projected = Math.round(lastValue * Math.pow(1 + growth, i + 1));
    const spread = projected * (0.06 + i * 0.015);
    return {
      month: `${month} '26`,
      predicted: projected,
      lower: Math.round(projected - spread),
      upper: Math.round(projected + spread),
    };
  });

  return {
    history,
    forecast,
    confidence: 92,
    metrics: {
      projectedRevenue: forecast.reduce((s, f) => s + f.predicted, 0),
      expectedGrowth: 31.4,
      nextMonth: forecast[0].predicted,
      riskLevel: "Low",
    },
    predictions: [
      { id: 1, label: "Next Month Revenue", value: forecast[0].predicted, delta: 5.2, format: "currency" },
      { id: 2, label: "6-Month Projection", value: forecast.reduce((s, f) => s + f.predicted, 0), delta: 31.4, format: "currency" },
      { id: 3, label: "Projected Orders", value: 15920, delta: 12.8, format: "number" },
      { id: 4, label: "Churn Risk", value: 3.1, delta: -0.6, format: "percent" },
    ],
  };
};

/* -------------------------------------------------------------- Files */
const uploadHistory = [
  { id: "F-1042", name: "sales_q2_2025.csv", size: 2_412_544, rows: 4204, status: "Processed", uploadedAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "F-1039", name: "customers_may.csv", size: 842_112, rows: 1560, status: "Processed", uploadedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "F-1035", name: "inventory_snapshot.csv", size: 1_284_000, rows: 2890, status: "Processed", uploadedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "F-1031", name: "ad_spend_april.csv", size: 512_004, rows: 640, status: "Failed", uploadedAt: new Date(Date.now() - 9 * 86400000).toISOString() },
];

/* ------------------------------------------------------------ Exports */
export const getDashboard = () =>
  delay({
    kpis,
    revenueSeries,
    salesSeries,
    trafficBreakdown,
    categorySeries,
    topProducts,
    recentOrders,
    activity,
    insights,
  });

export const getReports = () => delay({ reports, reportTypes, reportFormats });

export const getForecast = () => delay(buildForecast());

export const getUploadHistory = () => delay(uploadHistory);

export const analyticsMeta = { months: MONTHS };
