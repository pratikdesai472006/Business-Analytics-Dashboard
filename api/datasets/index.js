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
    const result = await datasets.listDatasets(req.user.id);
    return res.json({ success: true, datasets: result.map(serializeDataset) });
  } catch (error) {
    console.error("List Datasets Error:", error);
    return res.status(500).json({ message: "Could not load datasets." });
  }
});
