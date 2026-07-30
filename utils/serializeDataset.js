const serializeDataset = (dataset) => {
  if (!dataset) return null;
  return {
    id: String(dataset._id),
    name: dataset.name,
    type: dataset.type || dataset.source,
    source: dataset.source,
    fileSize: dataset.fileSize,
    rowCount: dataset.rowCount,
    headers: dataset.headers,
    status: dataset.status || "Processed",
    isActive: Boolean(dataset.isActive),
    uploadedAt: dataset.uploadedAt || dataset.createdAt,
    processedAt: dataset.processedAt,
    activatedAt: dataset.activatedAt,
    createdAt: dataset.createdAt,
    updatedAt: dataset.updatedAt,
  };
};

module.exports = serializeDataset;
