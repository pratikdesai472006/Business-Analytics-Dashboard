const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pickValue = (row, keys) => {
  if (!row || !row.data) return undefined;
  for (const key of keys) {
    const value = row.data[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  const entries = Object.entries(row.data);
  for (const targetKey of keys) {
    const targetNorm = targetKey.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [actualKey, val] of entries) {
      if (val === undefined || val === null || String(val).trim() === "") continue;
      const actualNorm = actualKey.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (actualNorm === targetNorm || actualNorm.includes(targetNorm) || targetNorm.includes(actualNorm)) {
        return val;
      }
    }
  }
  return undefined;
};

const getDateValue = (row) => {
  const candidate = pickValue(row, ["date", "Date", "createdAt", "created_at"]);
  if (!candidate) return null;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const monthKey = (date) => {
  if (!date) return "Unknown";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonth = (key) => {
  const [year, month] = key.split("-");
  const parsed = new Date(Number(year), Number(month) - 1, 1);
  return parsed.toLocaleString("en-US", { month: "short", year: "numeric" });
};

const buildInsights = (rows, summary) => {
  const insights = [];
  const revenueValues = rows.map((row) => toNumber(pickValue(row, ["revenue", "Revenue", "amount", "total", "totalRevenue"])));
  const totalRevenue = revenueValues.reduce((sum, value) => sum + value, 0);
  const orderCount = rows.length || 0;
  const avgOrderValue = orderCount ? totalRevenue / orderCount : 0;
  const statuses = rows.map((row) => String(pickValue(row, ["status", "Status", "payment_status"]) || "").trim().toLowerCase());
  const completed = statuses.filter((status) => ["paid", "complete", "completed", "success", "delivered"].includes(status)).length;
  const cancelled = statuses.filter((status) => ["cancelled", "canceled", "cancel", "void"].includes(status)).length;
  const returned = statuses.filter((status) => ["returned", "return", "refund", "refunded"].includes(status)).length;

  const products = rows.reduce((acc, row) => {
    const product = String(pickValue(row, ["product", "Product"]) || "Unknown").trim();
    const revenue = toNumber(pickValue(row, ["revenue", "Revenue", "amount", "total", "totalRevenue"]));
    if (!acc[product]) acc[product] = { name: product, revenue: 0, orders: 0 };
    acc[product].revenue += revenue;
    acc[product].orders += 1;
    return acc;
  }, {});

  const rankedProducts = Object.values(products).sort((a, b) => b.revenue - a.revenue);
  const topProduct = rankedProducts[0];
  const bottomProduct = rankedProducts[rankedProducts.length - 1];

  const customers = rows.reduce((acc, row) => {
    const customer = String(pickValue(row, ["customer", "Customer", "customerName", "customer_name"]) || "Unknown").trim();
    const revenue = toNumber(pickValue(row, ["revenue", "Revenue", "amount", "total", "totalRevenue"]));
    if (!acc[customer]) acc[customer] = { name: customer, revenue: 0, orders: 0 };
    acc[customer].revenue += revenue;
    acc[customer].orders += 1;
    return acc;
  }, {});
  const rankedCustomers = Object.values(customers).sort((a, b) => b.revenue - a.revenue);
  const topCustomer = rankedCustomers[0];
  const uniqueCustomers = new Set(Object.keys(customers)).size;
  const repeatCustomers = Object.values(customers).filter((customer) => customer.orders > 1).length;
  const repeatRate = uniqueCustomers ? (repeatCustomers / uniqueCustomers) * 100 : 0;

  const monthlyRevenueMap = rows.reduce((acc, row) => {
    const date = getDateValue(row);
    const month = monthKey(date);
    const value = toNumber(pickValue(row, ["revenue", "Revenue", "amount", "total", "totalRevenue"]));
    if (!month || month === "Unknown") return acc;
    acc[month] = (acc[month] || 0) + value;
    return acc;
  }, {});

  const monthlySeries = Object.entries(monthlyRevenueMap).sort(([left], [right]) => left.localeCompare(right));
  const values = monthlySeries.map(([, value]) => value);
  const recent = values[values.length - 1] || 0;
  const previous = values[values.length - 2] || 0;
  const momentum = previous ? ((recent - previous) / previous) * 100 : 0;
  const highestMonth = monthlySeries.reduce((best, [month, value]) => (value > best.value ? { month, value } : best), { month: null, value: -Infinity });
  const lowestMonth = monthlySeries.reduce((best, [month, value]) => (value < best.value ? { month, value } : best), { month: null, value: Infinity });
  const expectedNextMonth = recent + (recent * Math.max(0.03, Math.min(0.2, momentum / 100 || 0.05)));
  const expectedNextOrders = Math.max(1, Math.round((orderCount / Math.max(1, monthlySeries.length)) * 1.05));

  if (totalRevenue > 0) {
    insights.push({ tone: "green", title: `Highest revenue month: ${highestMonth.month ? formatMonth(highestMonth.month) : "N/A"}`, detail: `Revenue peaked at ₹${highestMonth.value.toLocaleString("en-IN")}.` });
    insights.push({ tone: "amber", title: `Lowest revenue month: ${lowestMonth.month ? formatMonth(lowestMonth.month) : "N/A"}`, detail: `The slowest month generated ₹${lowestMonth.value.toLocaleString("en-IN")}.` });
    insights.push({ tone: "blue", title: "Revenue trend", detail: momentum >= 0 ? `Revenue is up ${momentum.toFixed(1)}% versus the previous period.` : `Revenue fell ${Math.abs(momentum).toFixed(1)}% versus the previous period.` });
    insights.push({ tone: "violet", title: "Revenue growth", detail: `Projected next month revenue is about ₹${expectedNextMonth.toLocaleString("en-IN")}.` });
  }

  if (orderCount) {
    insights.push({ tone: "blue", title: "Order volume", detail: `You recorded ${orderCount} orders with an average order value of ₹${avgOrderValue.toLocaleString("en-IN")}.` });
    insights.push({ tone: "green", title: "Daily average orders", detail: `The dataset suggests an average of about ${Math.max(1, Math.round(orderCount / Math.max(1, monthlySeries.length))).toFixed(0)} orders per period.` });
  }

  if (topProduct) {
    insights.push({ tone: "green", title: "Best-selling product", detail: `${topProduct.name} drove ₹${topProduct.revenue.toLocaleString("en-IN")} in revenue.` });
  }
  if (bottomProduct && bottomProduct.name !== topProduct?.name) {
    insights.push({ tone: "amber", title: "Watchlist product", detail: `${bottomProduct.name} is the lowest-revenue product in this dataset.` });
  }

  if (topCustomer) {
    insights.push({ tone: "violet", title: "Top customer", detail: `${topCustomer.name} generated ₹${topCustomer.revenue.toLocaleString("en-IN")}.` });
  }
  if (uniqueCustomers) {
    insights.push({ tone: "blue", title: "Repeat customer rate", detail: `${repeatRate.toFixed(1)}% of customers placed more than one order.` });
  }

  if (orderCount) {
    const completionRate = orderCount ? (completed / orderCount) * 100 : 0;
    const cancellationRate = orderCount ? (cancelled / orderCount) * 100 : 0;
    const returnRate = orderCount ? (returned / orderCount) * 100 : 0;
    insights.push({ tone: "green", title: "Completion rate", detail: `${completionRate.toFixed(1)}% of orders are completed.` });
    insights.push({ tone: "amber", title: "Cancellation rate", detail: `${cancellationRate.toFixed(1)}% of orders were cancelled.` });
    insights.push({ tone: "amber", title: "Return rate", detail: `${returnRate.toFixed(1)}% of orders were returned.` });
  }

  if (momentum < -10) {
    insights.push({ tone: "amber", title: "Revenue drop", detail: "Revenue has fallen sharply compared with the previous period." });
  }
  if (cancelled > 0 && (cancelled / Math.max(1, orderCount)) > 0.15) {
    insights.push({ tone: "amber", title: "High cancellation risk", detail: "Cancelled orders are elevated; monitor conversion quality." });
  }
  if (returned > 0 && (returned / Math.max(1, orderCount)) > 0.1) {
    insights.push({ tone: "amber", title: "Return concern", detail: "Returns are increasing; inspect fulfilment and product issues." });
  }
  if (summary?.activeCustomers && summary.activeCustomers > 0) {
    insights.push({ tone: "blue", title: "Customer concentration", detail: `${summary.activeCustomers} active customers are driving the current revenue mix.` });
  }
  if (orderCount && expectedNextOrders > 0) {
    insights.push({ tone: "green", title: "Future order outlook", detail: `The next cycle is expected to bring about ${expectedNextOrders} orders.` });
  }

  return insights.slice(0, 12);
};

export const buildDashboardAnalytics = (dataset, rows) => {
  const revenueValues = rows.map((row) => toNumber(pickValue(row, ["revenue", "Revenue", "amount", "total", "totalRevenue"])));
  const totalRevenue = revenueValues.reduce((sum, value) => sum + value, 0);
  const orders = rows.length;
  const customerSet = new Set(rows.map((row) => String(pickValue(row, ["customer", "Customer", "customerName", "customer_name"]) || "").trim()).filter(Boolean));
  const monthlyRevenueMap = rows.reduce((acc, row) => {
    const date = getDateValue(row);
    const month = monthKey(date);
    const value = toNumber(pickValue(row, ["revenue", "Revenue", "amount", "total", "totalRevenue"]));
    if (!month || month === "Unknown") return acc;
    acc[month] = (acc[month] || 0) + value;
    return acc;
  }, {});

  const chartData = Object.entries(monthlyRevenueMap)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, value]) => ({ month: formatMonth(month), value }));

  const recentRevenue = chartData[chartData.length - 1]?.value || 0;
  const previousRevenue = chartData[chartData.length - 2]?.value || 0;
  const growth = previousRevenue ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const forecastData = chartData.length
    ? [
        ...chartData.map((point) => ({ month: point.month, value: point.value, forecast: null })),
        ...Array.from({ length: 6 }, (_, index) => ({
          month: `Forecast ${index + 1}`,
          value: null,
          forecast: recentRevenue + (recentRevenue * 0.08 * (index + 1)),
        })),
      ]
    : [];

  const summary = {
    totalRevenue,
    totalOrders: orders,
    activeCustomers: customerSet.size,
    growth,
    datasetName: dataset?.name || "Active dataset",
    rowCount: dataset?.rowCount || orders,
    lastUpdated: dataset?.updatedAt || dataset?.createdAt,
  };

  return {
    summary,
    chartData,
    forecastData,
    insights: buildInsights(rows, summary),
    reports: [
      { name: `${dataset?.name || "Active dataset"} summary`, category: "Revenue", period: "Current upload", updated: new Date(dataset?.updatedAt || dataset?.createdAt || Date.now()).toLocaleDateString("en-IN"), status: "Ready" },
      { name: `${dataset?.name || "Active dataset"} customer view`, category: "Customers", period: "Current upload", updated: new Date(dataset?.updatedAt || dataset?.createdAt || Date.now()).toLocaleDateString("en-IN"), status: "Ready" },
      { name: `${dataset?.name || "Active dataset"} growth outlook`, category: "Growth", period: "Current upload", updated: new Date(dataset?.updatedAt || dataset?.createdAt || Date.now()).toLocaleDateString("en-IN"), status: "Ready" },
    ],
  };
};
