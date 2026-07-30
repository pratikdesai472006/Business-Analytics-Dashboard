const mongoose = require("mongoose");
const Dataset = require("../models/Dataset");
const DatasetRow = require("../models/DatasetRow");
const analyticsCache = new Map();

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "csvUploads" });

const storeFile = (name, buffer, metadata) =>
  new Promise((resolve, reject) => {
    const stream = bucket().openUploadStream(name, { contentType: "text/csv", metadata });
    stream.on("error", reject);
    stream.on("finish", () => resolve(stream.id));
    stream.end(buffer);
  });

const saveRows = async (datasetId, userId, rows) => {
  const batchSize = 1000;
  for (let index = 0; index < rows.length; index += batchSize) {
    await DatasetRow.insertMany(
      rows.slice(index, index + batchSize).map((data, offset) => ({
        datasetId, userId, data, rowNumber: index + offset + 1,
      })),
    );
  }
};

const setActiveDataset = async (userId, datasetId) => {
  const now = new Date();
  await Dataset.updateMany({ userId }, { $set: { isActive: false } });
  await Dataset.updateOne({ _id: datasetId, userId }, { $set: { isActive: true, activatedAt: now, updatedAt: now } });
  clearCachedAnalytics(userId);
};

const createCsvDataset = async ({ userId, file, headers, rows }) => {
  const dataset = await Dataset.create({
    userId,
    uploadedBy: userId,
    name: file.originalname,
    type: "csv",
    source: "csv",
    fileSize: file.size,
    headers,
    status: "Processing",
    uploadedAt: new Date(),
  });
  let fileId;
  try {
    fileId = await storeFile(file.originalname, file.buffer, { userId: String(userId), datasetId: String(dataset._id) });
    await saveRows(dataset._id, userId, rows);
    dataset.fileId = fileId;
    dataset.rowCount = rows.length;
    dataset.status = "Processed";
    dataset.processedAt = new Date();
    await dataset.save();
    await setActiveDataset(userId, dataset._id);
    dataset.isActive = true;
    dataset.activatedAt = new Date();
    await dataset.save();
    return dataset;
  } catch (error) {
    if (fileId) await bucket().delete(fileId).catch(() => {});
    await DatasetRow.deleteMany({ datasetId: dataset._id });
    await Dataset.deleteOne({ _id: dataset._id });
    throw error;
  }
};

const createManualDataset = async ({ userId, name, rows }) => {
  const headers = Object.keys(rows[0] || {});
  const dataset = await Dataset.create({
    userId,
    uploadedBy: userId,
    name,
    type: "manual",
    source: "manual",
    headers,
    rowCount: rows.length,
    status: "Processing",
    uploadedAt: new Date(),
    isActive: false,
  });
  try {
    await saveRows(dataset._id, userId, rows);
    dataset.rowCount = rows.length;
    dataset.status = "Processed";
    dataset.processedAt = new Date();
    const hasActive = await Dataset.findOne({ userId, isActive: true });
    if (!hasActive) {
      await setActiveDataset(userId, dataset._id);
      dataset.isActive = true;
      dataset.activatedAt = new Date();
    } else {
      dataset.isActive = false;
    }
    await dataset.save();
    return dataset;
  } catch (error) {
    await DatasetRow.deleteMany({ datasetId: dataset._id });
    await Dataset.deleteOne({ _id: dataset._id });
    throw error;
  }
};

const listDatasets = (userId) => Dataset.find({ userId }).sort({ createdAt: -1 }).select("_id name type source fileSize rowCount headers status isActive uploadedAt processedAt activatedAt createdAt updatedAt").lean();
const findDataset = (id, userId) => Dataset.findOne({ _id: id, userId }).select("_id name type source fileSize rowCount headers status isActive uploadedAt processedAt activatedAt createdAt updatedAt").lean();
const getActiveDataset = async (userId) => {
  let dataset = await Dataset.findOne({ userId, isActive: true }).sort({ activatedAt: -1, updatedAt: -1 }).select("_id name type source fileSize rowCount headers status isActive uploadedAt processedAt activatedAt createdAt updatedAt").lean();
  if (!dataset) {
    dataset = await Dataset.findOne({ userId, type: "csv" }).sort({ createdAt: -1 }).select("_id name type source fileSize rowCount headers status isActive uploadedAt processedAt activatedAt createdAt updatedAt").lean();
    if (!dataset) {
      dataset = await Dataset.findOne({ userId }).sort({ createdAt: -1 }).select("_id name type source fileSize rowCount headers status isActive uploadedAt processedAt activatedAt createdAt updatedAt").lean();
    }
    if (dataset) {
      await setActiveDataset(userId, dataset._id);
      dataset.isActive = true;
    }
  }
  return dataset;
};
const datasetRows = (datasetId) => DatasetRow.find({ datasetId }).sort({ rowNumber: 1 }).select("rowNumber data").lean();
const activateDataset = async (userId, datasetId) => {
  const dataset = await Dataset.findOne({ _id: datasetId, userId });
  if (!dataset) return null;
  await setActiveDataset(userId, datasetId);
  return Dataset.findOne({ _id: datasetId, userId }).lean();
};

const renameDataset = async (userId, datasetId, name) => {
  const dataset = await Dataset.findOneAndUpdate({ _id: datasetId, userId }, { $set: { name, updatedAt: new Date() } }, { new: true });
  clearCachedAnalytics(userId);
  return dataset ? dataset.toObject() : null;
};

const deleteDataset = async (userId, datasetId) => {
  const dataset = await Dataset.findOne({ _id: datasetId, userId });
  if (!dataset) return { deleted: false, nextDataset: null };
  await DatasetRow.deleteMany({ datasetId, userId });
  if (dataset.fileId) await bucket().delete(dataset.fileId).catch(() => {});
  await Dataset.deleteOne({ _id: datasetId, userId });
  const nextDataset = await Dataset.findOne({ userId }).sort({ createdAt: -1 }).lean();
  if (dataset.isActive && nextDataset) {
    await setActiveDataset(userId, nextDataset._id);
  }
  clearCachedAnalytics(userId);
  return { deleted: true, nextDataset };
};

const downloadFile = (fileId) => bucket().openDownloadStream(fileId);

const getAnalyticsCacheKey = (userId) => `analytics:${String(userId)}`;
const getCachedAnalytics = (userId) => {
  const entry = analyticsCache.get(getAnalyticsCacheKey(userId));
  if (!entry) return null;
  if (Date.now() - entry.timestamp > 20_000) {
    analyticsCache.delete(getAnalyticsCacheKey(userId));
    return null;
  }
  return entry.value;
};
const setCachedAnalytics = (userId, value) => {
  analyticsCache.set(getAnalyticsCacheKey(userId), { value, timestamp: Date.now() });
};

const clearCachedAnalytics = (userId) => {
  analyticsCache.delete(getAnalyticsCacheKey(userId));
};

const getActiveDatasetAnalytics = async (userId) => {
  const cached = getCachedAnalytics(userId);
  if (cached) return cached;
  const dataset = await getActiveDataset(userId);
  if (!dataset) return { dataset: null, analytics: null };
  const rows = await datasetRows(dataset._id);
  const analytics = analyticsEngine.buildAnalytics(dataset, rows);
  setCachedAnalytics(userId, analytics);
  return { dataset, analytics };
};

const parseCsv = require("../utils/parseCsv");
const analyticsEngine = require("../utils/analyticsEngine");

const processDatasetUpload = async (userId, originalname, csvText) => {
  const { headers, rows } = parseCsv(csvText);
  const buffer = Buffer.from(csvText, "utf8");
  const dataset = await createCsvDataset({
    userId,
    file: {
      originalname,
      size: buffer.length,
      buffer,
    },
    headers,
    rows,
  });
  clearCachedAnalytics(userId);
  const analyticsResult = await getActiveDatasetAnalytics(userId);
  return { dataset, analytics: analyticsResult.analytics };
};

const getUserDatasets = listDatasets;

const getDatasetRows = async (userId, datasetId, page = 1, limit = 50) => {
  const allRows = await datasetRows(datasetId, userId);
  const total = allRows.length;
  const startIndex = (page - 1) * limit;
  const paginated = allRows.slice(startIndex, startIndex + limit);
  return { rows: paginated, total, page, limit };
};

const getDatasetFile = async (userId, datasetId) => {
  const dataset = await findDataset(datasetId, userId);
  if (!dataset || !dataset.fileId) throw new Error("File not found");
  const stream = downloadFile(dataset.fileId);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return { filename: dataset.name, content: Buffer.concat(chunks) };
};

const formatNumber = (value) => {
  if (value === undefined || value === null || value === "") return "0";
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(numeric);
};

const formatPercent = (value) => {
  if (value === undefined || value === null || value === "") return "0%";
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) return "0%";
  return `${numeric.toFixed(2)}%`;
};

const escapeCsvValue = (value) => {
  if (value === undefined || value === null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const toCsvRow = (values) => values.map(escapeCsvValue).join(",");

const buildBusinessReportCsv = ({ dataset, rows, analytics }) => {
  const summary = analytics?.summary || {};
  const chartData = analytics?.chartData || [];
  const forecastData = analytics?.forecastData || [];
  const insights = analytics?.insights || [];
  const datasetName = dataset?.name || summary.datasetName || "Active dataset";
  const generatedOn = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const revenueValues = rows.map((row) => {
    const raw = row?.data ? (row.data.revenue ?? row.data.Revenue ?? row.data.amount ?? row.data.total ?? row.data.totalRevenue) : undefined;
    const numeric = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  });
  const totalRevenue = revenueValues.reduce((sum, value) => sum + value, 0);
  const totalOrders = rows.length || 0;
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const customerSet = new Set(rows.map((row) => String(row?.data?.customer || row?.data?.Customer || row?.data?.customerName || row?.data?.customer_name || "").trim()).filter(Boolean));
  const statuses = rows.map((row) => String(row?.data?.status || row?.data?.Status || row?.data?.payment_status || "").trim().toLowerCase());
  const completed = statuses.filter((status) => ["paid", "complete", "completed", "success", "delivered"].includes(status)).length;
  const cancelled = statuses.filter((status) => ["cancelled", "canceled", "cancel", "void"].includes(status)).length;
  const returned = statuses.filter((status) => ["returned", "return", "refund", "refunded"].includes(status)).length;
  const completionRate = totalOrders ? (completed / totalOrders) * 100 : 0;
  const cancellationRate = totalOrders ? (cancelled / totalOrders) * 100 : 0;
  const returnRate = totalOrders ? (returned / totalOrders) * 100 : 0;
  const highestMonth = chartData.reduce((best, point) => (point.value > best.value ? { month: point.month, value: point.value } : best), { month: "N/A", value: -Infinity });
  const lowestMonth = chartData.reduce((best, point) => (point.value < best.value ? { month: point.month, value: point.value } : best), { month: "N/A", value: Infinity });
  const lastForecast = [...forecastData].reverse().find((point) => point?.forecast !== null && point?.forecast !== undefined);
  const forecastRevenue = lastForecast?.forecast ?? summary.totalRevenue ?? totalRevenue;

  const summaryLines = [
    "BUSINESS SUMMARY",
    toCsvRow(["Metric", "Value"]),
    toCsvRow(["Dataset", datasetName]),
    toCsvRow(["Generated On", generatedOn]),
    toCsvRow(["Total Revenue", formatNumber(totalRevenue)]),
    toCsvRow(["Total Orders", formatNumber(totalOrders)]),
    toCsvRow(["Active Customers", formatNumber(customerSet.size)]),
    toCsvRow(["Average Order Value", formatNumber(averageOrderValue)]),
    toCsvRow(["Revenue Growth", formatPercent(summary.growth ?? 0)]),
    toCsvRow(["Highest Revenue Month", highestMonth.month || "N/A"]),
    toCsvRow(["Lowest Revenue Month", lowestMonth.month || "N/A"]),
    toCsvRow(["Top Product", "N/A"]),
    toCsvRow(["Top Customer", "N/A"]),
    toCsvRow(["Completion Rate", formatPercent(completionRate)]),
    toCsvRow(["Cancellation Rate", formatPercent(cancellationRate)]),
    toCsvRow(["Return Rate", formatPercent(returnRate)]),
    toCsvRow(["Forecast Revenue", formatNumber(forecastRevenue)]),
  ];

  const productStats = rows.reduce((acc, row) => {
    const product = String(row?.data?.product || row?.data?.Product || "Unknown").trim();
    const revenue = Number.parseFloat(String(row?.data?.revenue || row?.data?.Revenue || row?.data?.amount || row?.data?.total || row?.data?.totalRevenue || 0).replace(/[^0-9.-]/g, ""));
    if (!acc[product]) acc[product] = { name: product, revenue: 0, orders: 0 };
    acc[product].revenue += Number.isFinite(revenue) ? revenue : 0;
    acc[product].orders += 1;
    return acc;
  }, {});
  const topProductEntry = Object.values(productStats).sort((left, right) => right.revenue - left.revenue)[0];
  const customerStats = rows.reduce((acc, row) => {
    const customer = String(row?.data?.customer || row?.data?.Customer || row?.data?.customerName || row?.data?.customer_name || "Unknown").trim();
    const revenue = Number.parseFloat(String(row?.data?.revenue || row?.data?.Revenue || row?.data?.amount || row?.data?.total || row?.data?.totalRevenue || 0).replace(/[^0-9.-]/g, ""));
    if (!acc[customer]) acc[customer] = { name: customer, revenue: 0, orders: 0 };
    acc[customer].revenue += Number.isFinite(revenue) ? revenue : 0;
    acc[customer].orders += 1;
    return acc;
  }, {});
  const topCustomerEntry = Object.values(customerStats).sort((left, right) => right.revenue - left.revenue)[0];
  summaryLines[summaryLines.indexOf(summaryLines.find((line) => line.includes("Top Product")))] = toCsvRow(["Top Product", topProductEntry?.name || "N/A"]);
  summaryLines[summaryLines.indexOf(summaryLines.find((line) => line.includes("Top Customer")))] = toCsvRow(["Top Customer", topCustomerEntry?.name || "N/A"]);

  const insightLines = [
    "",
    "BUSINESS INSIGHTS",
    toCsvRow(["Title", "Description"]),
    ...insights.map((insight) => toCsvRow([insight.title || "Insight", insight.detail || ""])),
  ];

  const transactionHeaders = dataset?.headers?.length ? dataset.headers : Object.keys(rows[0]?.data || {});
  const transactionLines = [
    "",
    "TRANSACTION DATA",
    toCsvRow(transactionHeaders),
    ...rows.map((row) => toCsvRow(transactionHeaders.map((header) => row?.data?.[header] ?? ""))),
  ];

  return `\uFEFF${[...summaryLines, ...insightLines, ...transactionLines].join("\r\n")}`;
};

const exportDatasetCsv = async (userId, datasetId) => {
  const activeDataset = await getActiveDataset(userId);
  const dataset = datasetId ? await findDataset(datasetId, userId) : activeDataset;
  if (!dataset) throw new Error("Dataset not found");
  const rows = await datasetRows(dataset._id, userId);
  const analyticsResult = await getActiveDatasetAnalytics(userId);
  const csvContent = buildBusinessReportCsv({
    dataset: { ...dataset, headers: dataset.headers || analyticsResult.dataset?.headers || [] },
    rows,
    analytics: analyticsResult.analytics,
  });
  return { filename: `${(dataset.name || "business-report").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}_report.csv`, csvContent };
};

module.exports = {
  createCsvDataset,
  createManualDataset,
  listDatasets,
  getUserDatasets,
  findDataset,
  getActiveDataset,
  getActiveDatasetAnalytics,
  processDatasetUpload,
  datasetRows,
  getDatasetRows,
  getDatasetFile,
  exportDatasetCsv,
  activateDataset,
  setActiveDataset,
  renameDataset,
  deleteDataset,
  downloadFile,
  getCachedAnalytics,
  setCachedAnalytics,
};
