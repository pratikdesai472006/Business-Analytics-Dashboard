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

const createCsvDataset = async ({ userId, file, headers, rows }) => {
  const dataset = await Dataset.create({
    userId, name: file.originalname, source: "csv", fileSize: file.size, headers,
  });
  let fileId;
  try {
    fileId = await storeFile(file.originalname, file.buffer, { userId: String(userId), datasetId: String(dataset._id) });
    await saveRows(dataset._id, userId, rows);
    dataset.fileId = fileId;
    dataset.rowCount = rows.length;
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
  const dataset = await Dataset.create({ userId, name, source: "manual", headers, rowCount: rows.length });
  try {
    await saveRows(dataset._id, userId, rows);
    return dataset;
  } catch (error) {
    await Dataset.deleteOne({ _id: dataset._id });
    throw error;
  }
};

const listDatasets = (userId) => Dataset.find({ userId }).sort({ createdAt: -1 }).lean();
const findDataset = (id, userId) => Dataset.findOne({ _id: id, userId }).lean();
const datasetRows = (datasetId, userId) => DatasetRow.find({ datasetId, userId }).sort({ rowNumber: 1 }).lean();
const downloadFile = (fileId) => bucket().openDownloadStream(fileId);

module.exports = { createCsvDataset, createManualDataset, listDatasets, findDataset, datasetRows, downloadFile };
