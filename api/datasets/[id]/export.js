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

    const rows = await datasets.datasetRows(dataset._id, req.user.id);
    const headers = dataset.headers || [];
    const lines = [];

    const headerLine = headers.join(",");
    if (headerLine) lines.push(headerLine);

    rows.forEach((row) => {
      const values = headers.map((header) => String(row.data?.[header] ?? ""));
      lines.push(values.join(","));
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${dataset.name}.csv"`);
    return res.send(lines.join("\n"));
  } catch (error) {
    console.error("Export CSV Error:", error);
    return res.status(500).json({ message: "Could not export dataset." });
  }
});
