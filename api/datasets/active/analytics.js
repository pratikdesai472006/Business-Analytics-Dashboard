const connectDatabase = require("../../../lib/mongodb");
const { protect } = require("../../../lib/auth");
const datasets = require("../../../services/datasetService");
const { buildAnalytics } = require("../../../utils/analyticsEngine");

module.exports = protect(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await connectDatabase();
    const dataset = await datasets.getActiveDataset(req.user.id);
    if (!dataset) {
      return res.json({ success: true, analytics: null });
    }

    const cached = datasets.getCachedAnalytics(req.user.id);
    if (cached) {
      return res.json({ success: true, analytics: cached });
    }

    const rows = await datasets.datasetRows(dataset._id, req.user.id);
    const analyticsPayload = buildAnalytics(dataset, rows);
    datasets.setCachedAnalytics(req.user.id, analyticsPayload);

    return res.json({ success: true, analytics: analyticsPayload });
  } catch (error) {
    console.error("Analytics Error:", error);
    return res.status(500).json({ message: "Could not build analytics." });
  }
});
