const mongoose = require("mongoose");
const Dataset = require("../models/Dataset");
const DatasetRow = require("../models/DatasetRow");

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
  await Dataset.updateMany({ userId, isActive: true }, { $set: { isActive: false } });
  await Dataset.updateOne({ _id: datasetId, userId }, { $set: { isActive: true, activatedAt: now, updatedAt: now } });
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
  });
  try {
    await saveRows(dataset._id, userId, rows);
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
    await DatasetRow.deleteMany({ datasetId: dataset._id });
    await Dataset.deleteOne({ _id: dataset._id });
    throw error;
  }
};

const listDatasets = (userId) => Dataset.find({ userId }).sort({ createdAt: -1 }).lean();
const findDataset = (id, userId) => Dataset.findOne({ _id: id, userId }).lean();
const getActiveDataset = (userId) => Dataset.findOne({ userId, isActive: true }).sort({ createdAt: -1 }).lean();
const datasetRows = (datasetId, userId) => DatasetRow.find({ datasetId, userId }).sort({ rowNumber: 1 }).lean();
const activateDataset = async (userId, datasetId) => {
  const dataset = await Dataset.findOne({ _id: datasetId, userId });
  if (!dataset) return null;
  await setActiveDataset(userId, datasetId);
  return Dataset.findOne({ _id: datasetId, userId }).lean();
};

const renameDataset = async (userId, datasetId, name) => {
  const dataset = await Dataset.findOneAndUpdate({ _id: datasetId, userId }, { $set: { name, updatedAt: new Date() } }, { new: true });
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
  return { deleted: true, nextDataset };
};

const downloadFile = (fileId) => bucket().openDownloadStream(fileId);

module.exports = {
  createCsvDataset,
  createManualDataset,
  listDatasets,
  findDataset,
  getActiveDataset,
  datasetRows,
  activateDataset,
  renameDataset,
  deleteDataset,
  downloadFile,
};
