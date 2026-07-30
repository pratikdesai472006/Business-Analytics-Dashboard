const Busboy = require("busboy");
const connectDatabase = require("../lib/mongodb");
const { verifyToken } = require("../lib/auth");
const {
  getUserDatasets,
  getActiveDataset,
  getActiveDatasetAnalytics,
  processDatasetUpload,
  createManualDataset,
  setActiveDataset,
  renameDataset,
  deleteDataset,
  getDatasetRows,
  getDatasetFile,
  exportDatasetCsv,
} = require("../services/datasetService");

// Disable default Vercel body parser for streaming busboy multipart uploads
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

function parseRawBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
}

module.exports = async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Access denied. Invalid or missing token." });
  }

  const userId = decoded.id;
  const url = req.url || "";
  const method = req.method;

  try {
    await connectDatabase();

    // 1. MULTIPART CSV UPLOAD: /api/datasets/upload
    if (url.includes("/upload")) {
      if (method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("multipart/form-data")) {
        return res.status(400).json({ message: "Content-Type must be multipart/form-data" });
      }

      const contentLength = parseInt(req.headers["content-length"] || "0", 10);
      const MAX_BYTES = 4.5 * 1024 * 1024; // 4.5 MB Vercel Serverless Payload limit
      if (contentLength > MAX_BYTES) {
        return res.status(413).json({
          message: "File size exceeds Vercel serverless limit of 4.5 MB. Please upload a smaller CSV file.",
        });
      }

      return new Promise((resolve) => {
        const busboy = Busboy({ headers: req.headers, limits: { fileSize: MAX_BYTES } });
        let fileBuffer = Buffer.alloc(0);
        let originalName = "uploaded_dataset.csv";
        let isLimitExceeded = false;

        busboy.on("file", (fieldname, file, filenameInfo) => {
          if (filenameInfo && filenameInfo.filename) {
            originalName = filenameInfo.filename;
          }
          file.on("data", (data) => {
            fileBuffer = Buffer.concat([fileBuffer, data]);
            if (fileBuffer.length > MAX_BYTES) {
              isLimitExceeded = true;
              file.resume();
            }
          });
        });

        busboy.on("finish", async () => {
          if (isLimitExceeded) {
            res.status(413).json({
              message: "File size exceeds Vercel serverless limit of 4.5 MB. Please upload a smaller CSV file.",
            });
            return resolve();
          }

          if (!fileBuffer || fileBuffer.length === 0) {
            res.status(400).json({ message: "No CSV file uploaded." });
            return resolve();
          }

          try {
            const csvText = fileBuffer.toString("utf8");
            const result = await processDatasetUpload(userId, originalName, csvText);
            res.status(201).json({
              success: true,
              message: "Dataset processed and set to active",
              dataset: result.dataset,
              analytics: result.analytics,
            });
          } catch (err) {
            res.status(400).json({ message: err.message || "Failed to process CSV dataset" });
          }
          resolve();
        });

        busboy.on("error", (err) => {
          res.status(500).json({ message: err.message || "Upload processing error" });
          resolve();
        });

        req.pipe(busboy);
      });
    }

    // For non-upload endpoints, parse JSON body if present
    let body = {};
    if (["POST", "PATCH", "PUT"].includes(method)) {
      body = await parseRawBody(req);
    }

    // 2. MANUAL DATASET: /api/datasets/manual
    if (url.includes("/manual")) {
      if (method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });
      const { name, rows } = body;
      const result = await createManualDataset(userId, name, rows);
      return res.status(201).json({
        success: true,
        message: "Manual dataset created successfully",
        dataset: result.dataset,
        analytics: result.analytics,
      });
    }

    // 3. ACTIVE DATASET ANALYTICS: /api/datasets/active/analytics
    if (url.includes("/active/analytics")) {
      if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
      const result = await getActiveDatasetAnalytics(userId);
      return res.status(200).json(result);
    }

    // 4. ACTIVE DATASET METADATA: /api/datasets/active
    if (url.endsWith("/active") || url.includes("/active?")) {
      if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
      const dataset = await getActiveDataset(userId);
      return res.status(200).json({ dataset });
    }

    // Extract ID if path matches /api/datasets/:id...
    const matches = url.match(/\/api\/datasets\/([a-f0-9]{24})(.*)/i);
    if (matches) {
      const datasetId = matches[1];
      const subpath = matches[2] || "";

      // 5. ACTIVATE DATASET: /api/datasets/:id/activate
      if (subpath.includes("/activate")) {
        if (method !== "PATCH") return res.status(405).json({ message: "Method Not Allowed" });
        const result = await setActiveDataset(userId, datasetId);
        return res.status(200).json({
          success: true,
          message: "Dataset activated successfully",
          dataset: result.dataset,
          analytics: result.analytics,
        });
      }

      // 6. RENAME DATASET: /api/datasets/:id/rename
      if (subpath.includes("/rename")) {
        if (method !== "PATCH") return res.status(405).json({ message: "Method Not Allowed" });
        const { name } = body;
        const dataset = await renameDataset(userId, datasetId, name);
        return res.status(200).json({ success: true, dataset });
      }

      // 7. GET DATASET ROWS: /api/datasets/:id/rows
      if (subpath.includes("/rows")) {
        if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
        const page = parseInt(req.query.page || "1", 10);
        const limit = parseInt(req.query.limit || "50", 10);
        const result = await getDatasetRows(userId, datasetId, page, limit);
        return res.status(200).json(result);
      }

      // 8. GET DATASET FILE: /api/datasets/:id/file
      if (subpath.includes("/file")) {
        if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
        const result = await getDatasetFile(userId, datasetId);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
        return res.status(200).send(result.content);
      }

      // 9. EXPORT DATASET CSV: /api/datasets/:id/export
      if (subpath.includes("/export")) {
        if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
        const result = await exportDatasetCsv(userId, datasetId);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
        return res.status(200).send(result.csvContent);
      }

      // 10. DELETE DATASET: /api/datasets/:id
      if (method === "DELETE") {
        await deleteDataset(userId, datasetId);
        return res.status(200).json({ success: true, message: "Dataset deleted successfully" });
      }
    }

    // 11. LIST DATASETS: /api/datasets (GET)
    if (method === "GET") {
      const datasets = await getUserDatasets(userId);
      return res.status(200).json({ datasets });
    }

    return res.status(404).json({ message: "Dataset endpoint not found" });
  } catch (error) {
    console.error("Datasets API Error:", error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
