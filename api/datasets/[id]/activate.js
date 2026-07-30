const connectDatabase = require("../../../lib/mongodb");
const { protect } = require("../../../lib/auth");
const datasets = require("../../../services/datasetService");
const serializeDataset = require("../../../utils/serializeDataset");

module.exports = protect(async (req, res) => {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;

  try {
    await connectDatabase();
    const dataset = await datasets.activateDataset(req.user.id, id);
    if (!dataset) {
      return res.status(404).json({ message: "Dataset not found." });
    }
    return res.json({ success: true, dataset: serializeDataset(dataset) });
  } catch (error) {
    console.error("Activate Dataset Error:", error);
    return res.status(500).json({ message: "Could not activate dataset." });
  }
});
