const connectDatabase = require("../../lib/mongodb");
const { protect } = require("../../lib/auth");
const datasets = require("../../services/datasetService");
const serializeDataset = require("../../utils/serializeDataset");

module.exports = protect(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await connectDatabase();
    const dataset = await datasets.getActiveDataset(req.user.id);
    if (!dataset) {
      return res.json({ success: true, dataset: null, rows: [] });
    }
    const result = await datasets.datasetRows(dataset._id, req.user.id);
    return res.json({
      success: true,
      dataset: serializeDataset(dataset),
      rows: result.map((row) => ({ rowNumber: row.rowNumber, data: row.data })),
    });
  } catch (error) {
    console.error("Active Dataset Error:", error);
    return res.status(500).json({ message: "Could not load active dataset." });
  }
});
