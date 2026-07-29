const parseCsv = require("../utils/parseCsv");
const datasets = require("../services/datasetService");

const serialize = (dataset) => ({
  id: String(dataset._id), name: dataset.name, source: dataset.source, fileSize: dataset.fileSize,
  rowCount: dataset.rowCount, headers: dataset.headers, createdAt: dataset.createdAt,
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

module.exports = { uploadCsv, createManual, list, rows, file };
