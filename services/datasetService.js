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

const exportDatasetCsv = async (userId, datasetId) => {
  const dataset = await findDataset(datasetId, userId);
  if (!dataset) throw new Error("Dataset not found");
  const rows = await datasetRows(datasetId, userId);
  const headers = dataset.headers || Object.keys(rows[0]?.data || {});
  const csvLines = [headers.join(",")];
  for (const r of rows) {
    const values = headers.map((h) => {
      const val = r.data[h] ?? "";
      return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
    });
    csvLines.push(values.join(","));
  }
  return { filename: `${dataset.name}_export.csv`, csvContent: csvLines.join("\n") };
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
