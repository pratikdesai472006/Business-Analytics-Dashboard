const connectDatabase = require("../../../lib/mongodb");
const { protect } = require("../../../lib/auth");
const datasets = require("../../../services/datasetService");

module.exports = protect(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;

  try {
    await connectDatabase();
    const dataset = await datasets.findDataset(id, req.user.id);
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found." });
    }
    const result = await datasets.datasetRows(dataset._id, req.user.id);
    return res.json({
      success: true,
      rows: result.map((row) => ({ rowNumber: row.rowNumber, data: row.data })),
    });
  } catch (error) {
    console.error("Dataset Rows Error:", error);
    return res.status(400).json({ message: "Could not load dataset rows." });
  }
});
