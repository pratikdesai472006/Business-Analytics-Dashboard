const Busboy = require("busboy");
const connectDatabase = require("../../lib/mongodb");
const { protect } = require("../../lib/auth");
const parseCsv = require("../../utils/parseCsv");
const datasets = require("../../services/datasetService");
const serializeDataset = require("../../utils/serializeDataset");

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5 MB Vercel Serverless Payload limit

const parseMultipart = (req) => {
  return new Promise((resolve, reject) => {
    let busboy;
    try {
      busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: MAX_FILE_SIZE },
      });
    } catch (err) {
      return reject(err);
    }

    let fileBuffer = null;
    let fileName = "";
    let fileSize = 0;
    let fileTruncated = false;

    busboy.on("file", (fieldname, stream, info) => {
      const { filename } = info || {};
      fileName = filename || "uploaded.csv";

      const chunks = [];
      stream.on("data", (chunk) => {
        fileSize += chunk.length;
        chunks.push(chunk);
      });

      stream.on("limit", () => {
        fileTruncated = true;
      });

      stream.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("finish", () => {
      if (fileTruncated || fileSize > MAX_FILE_SIZE) {
        return reject(new Error("File size exceeds Vercel serverless limit of 4.5 MB. Please upload a smaller CSV file."));
      }
      if (!fileBuffer || fileBuffer.length === 0) {
        return reject(new Error("A CSV file is required."));
      }
      if (!fileName.toLowerCase().endsWith(".csv")) {
        return reject(new Error("Only CSV files are supported."));
      }

      resolve({
        buffer: fileBuffer,
        originalname: fileName,
        size: fileSize,
      });
    });

    busboy.on("error", (error) => reject(error));

    req.pipe(busboy);
  });
};

const uploadHandler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await connectDatabase();

    const file = await parseMultipart(req);
    const parsed = parseCsv(file.buffer.toString("utf8"));

    const dataset = await datasets.createCsvDataset({
      userId: req.user.id,
      file,
      ...parsed,
    });

    return res.status(201).json({
      success: true,
      dataset: serializeDataset(dataset),
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(400).json({
      message: error.message || "Could not process CSV data.",
    });
  }
};

module.exports = protect(uploadHandler);

// Disable Vercel bodyParser so busboy can parse multipart/form-data stream
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
