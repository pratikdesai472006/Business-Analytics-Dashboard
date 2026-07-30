const connectDatabase = require("../../../lib/mongodb");
const { protect } = require("../../../lib/auth");
const datasets = require("../../../services/datasetService");
const serializeDataset = require("../../../utils/serializeDataset");

module.exports = protect(async (req, res) => {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;

  try {
    await connectDatabase();
    const result = await datasets.deleteDataset(req.user.id, id);
    if (!result.deleted) {
      return res.status(404).json({ message: "Dataset not found." });
    }
    return res.json({
      success: true,
      deleted: true,
      nextDataset: result.nextDataset ? serializeDataset(result.nextDataset) : null,
    });
  } catch (error) {
    console.error("Delete Dataset Error:", error);
    return res.status(500).json({ message: "Could not delete dataset." });
  }
});
