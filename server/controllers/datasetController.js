const parseCsv = require("../utils/parseCsv");
const datasets = require("../services/datasetService");
const { buildAnalytics } = require("../utils/analyticsEngine");

const serialize = (dataset) => ({
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
});


const uploadCsv = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "A CSV file is required." });
  try {
    const parsed = parseCsv(req.file.buffer.toString("utf8"));
    const dataset = await datasets.createCsvDataset({ userId: req.user.id, file: req.file, ...parsed });
    return res.status(201).json({ success: true, dataset: serialize(dataset) });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Could not process CSV data." });
  }
};

const createManual = async (req, res) => {
  const { name, rows } = req.body;
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ message: "At least one row is required." });
  try {
    const dataset = await datasets.createManualDataset({ userId: req.user.id, name: name || `manual-entry-${new Date().toISOString().slice(0, 10)}.csv`, rows });
    return res.status(201).json({ success: true, dataset: serialize(dataset) });
  } catch {
    return res.status(500).json({ message: "Could not save manual data." });
  }
};

const activate = async (req, res) => {
  try {
    const dataset = await datasets.activateDataset(req.user.id, req.params.id);
    if (!dataset) return res.status(404).json({ message: "Dataset not found." });
    return res.json({ success: true, dataset: serialize(dataset) });
  } catch {
    return res.status(500).json({ message: "Could not activate dataset." });
  }
};

const rename = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ message: "A dataset name is required." });
    const dataset = await datasets.renameDataset(req.user.id, req.params.id, String(name).trim());
    if (!dataset) return res.status(404).json({ message: "Dataset not found." });
    return res.json({ success: true, dataset: serialize(dataset) });
  } catch {
    return res.status(500).json({ message: "Could not rename dataset." });
  }
};

const remove = async (req, res) => {
  try {
    const result = await datasets.deleteDataset(req.user.id, req.params.id);
    if (!result.deleted) return res.status(404).json({ message: "Dataset not found." });
    return res.json({ success: true, deleted: true, nextDataset: result.nextDataset ? serialize(result.nextDataset) : null });
  } catch {
    return res.status(500).json({ message: "Could not delete dataset." });
  }
};

const list = async (req, res) => {
  try {
    const result = await datasets.listDatasets(req.user.id);
    return res.json({ success: true, datasets: result.map(serialize) });
  } catch {
    return res.status(500).json({ message: "Could not load datasets." });
  }
};

const rows = async (req, res) => {
  try {
    const dataset = await datasets.findDataset(req.params.id, req.user.id);
    if (!dataset) return res.status(404).json({ message: "Dataset not found." });
    const result = await datasets.datasetRows(dataset._id, req.user.id);
    return res.json({ success: true, rows: result.map((row) => ({ rowNumber: row.rowNumber, data: row.data })) });
  } catch {
    return res.status(400).json({ message: "Could not load dataset rows." });
  }
};

const active = async (req, res) => {
  try {
    const dataset = await datasets.getActiveDataset(req.user.id);
    if (!dataset) return res.json({ success: true, dataset: null, rows: [] });
    const result = await datasets.datasetRows(dataset._id, req.user.id);
    return res.json({ success: true, dataset: serialize(dataset), rows: result.map((row) => ({ rowNumber: row.rowNumber, data: row.data })) });
  } catch {
    return res.status(500).json({ message: "Could not load active dataset." });
  }
};

const analytics = async (req, res) => {
  try {
    const dataset = await datasets.getActiveDataset(req.user.id);
    if (!dataset) return res.json({ success: true, analytics: null });

    const cached = datasets.getCachedAnalytics(req.user.id);
    if (cached) {
      return res.json({ success: true, analytics: cached });
    }

    const rows = await datasets.datasetRows(dataset._id, req.user.id);
    const analyticsPayload = buildAnalytics(dataset, rows);
    datasets.setCachedAnalytics(req.user.id, analyticsPayload);
    return res.json({ success: true, analytics: analyticsPayload });
  } catch {
    return res.status(500).json({ message: "Could not build analytics." });
  }
};

const file = async (req, res) => {
  try {
    const dataset = await datasets.findDataset(req.params.id, req.user.id);
    if (!dataset?.fileId) return res.status(404).json({ message: "CSV file not found." });
    res.set({ "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${dataset.name}"` });
    const stream = datasets.downloadFile(dataset.fileId);
    stream.on("error", () => res.status(404).json({ message: "CSV file not found." }));
    return stream.pipe(res);
  } catch {
    return res.status(400).json({ message: "Could not download CSV file." });
  }
};

const exportCsv = async (req, res) => {
  try {
    const dataset = await datasets.findDataset(req.params.id, req.user.id);
    if (!dataset) return res.status(404).json({ message: "Dataset not found." });
    const rows = await datasets.datasetRows(dataset._id, req.user.id);
    const headers = dataset.headers || [];
    const lines = [];
    const headerLine = headers.join(",");
    if (headerLine) lines.push(headerLine);
    rows.forEach((row) => {
      const values = headers.map((header) => String(row.data?.[header] ?? ""));
      lines.push(values.join(","));
    });
    res.set({ "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${dataset.name}.csv"` });
    return res.send(lines.join("\n"));
  } catch {
    return res.status(500).json({ message: "Could not export dataset." });
  }
};

module.exports = { uploadCsv, createManual, list, rows, active, analytics, file, exportCsv, activate, rename, remove };
