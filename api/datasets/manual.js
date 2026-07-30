const connectDatabase = require("../../lib/mongodb");
const { protect } = require("../../lib/auth");
const datasets = require("../../services/datasetService");
const serializeDataset = require("../../utils/serializeDataset");

module.exports = protect(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await connectDatabase();

    const { name, rows } = req.body || {};
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ message: "At least one row is required." });
    }

    const dataset = await datasets.createManualDataset({
      userId: req.user.id,
      name: name || `manual-entry-${new Date().toISOString().slice(0, 10)}.csv`,
      rows,
    });

    return res.status(201).json({
      success: true,
      dataset: serializeDataset(dataset),
    });
  } catch (error) {
    console.error("Create Manual Error:", error);
    return res.status(500).json({ message: "Could not save manual data." });
  }
});
