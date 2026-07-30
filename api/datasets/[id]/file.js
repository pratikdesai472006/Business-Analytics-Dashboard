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
    if (!dataset?.fileId) {
      return res.status(404).json({ message: "CSV file not found." });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${dataset.name}"`);

    const stream = datasets.downloadFile(dataset.fileId);
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(404).json({ message: "CSV file not found." });
      }
    });

    return stream.pipe(res);
  } catch (error) {
    console.error("Dataset File Error:", error);
    return res.status(400).json({ message: "Could not download CSV file." });
  }
});
