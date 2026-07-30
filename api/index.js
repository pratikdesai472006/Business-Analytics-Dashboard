const bcrypt = require("bcryptjs");
const Busboy = require("busboy");
const connectDatabase = require("../lib/mongodb");
const { verifyToken } = require("../lib/auth");
const generateToken = require("../utils/generateToken");
const { findUserByEmail, createUser, getUserProfile } = require("../services/authService");
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
const {
  getUserOrders,
  createOrder,
  updateOrderStatus,
  generateReceiptPdf,
} = require("../services/paymentService");
const { processPaymentReminders } = require("../services/reminderService");

// Disable Vercel body parser for multipart CSV streaming uploads
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

function parseRawBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") {
      return resolve(req.body);
    }
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
  const url = req.url || "";
  const method = req.method;

  try {
    await connectDatabase();

    // =========================================
    // 1. HEALTH CHECK: GET /api/health
    // =========================================
    if (url.includes("/api/health") || url.includes("/health")) {
      return res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
    }

    // =========================================
    // 2. CRON REMINDERS: GET /api/cron/reminders
    // =========================================
    if (url.includes("/api/cron/reminders") || url.includes("/cron/reminders")) {
      const result = await processPaymentReminders();
      return res.status(200).json({
        success: true,
        message: "Daily payment reminders cron executed successfully",
        processedCount: result.processedCount,
      });
    }

    // =========================================
    // 3. AUTH ROUTES: /api/auth/*
    // =========================================
    if (url.includes("/auth")) {
      let body = {};
      if (method === "POST") body = await parseRawBody(req);

      // 3A. REGISTER: /api/auth/register
      if (url.includes("/register")) {
        if (method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

        const { fullName, email, password } = body;
        if (!fullName || !email || !password) {
          return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await createUser(fullName, email, hashedPassword);

        return res.status(201).json({
          success: true,
          message: "Registration Successful",
          token: generateToken(result.id),
          user: { id: result.id, fullName: result.fullName, email: result.email },
        });
      }

      // 3B. LOGIN: /api/auth/login
      if (url.includes("/login")) {
        if (method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

        const { email, password } = body;
        if (!email || !password) {
          return res.status(400).json({ message: "All fields are required" });
        }

        const user = await findUserByEmail(email);
        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        return res.status(200).json({
          success: true,
          message: "Login Successful",
          token: generateToken(user.id),
          user: { id: user.id, fullName: user.fullName, email: user.email },
        });
      }

      // 3C. GET CURRENT USER: /api/auth/me
      if (url.includes("/me")) {
        if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

        const decoded = verifyToken(req);
        if (!decoded) {
          return res.status(401).json({ success: false, message: "Access denied. Invalid or missing token." });
        }

        const user = await getUserProfile(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({
          success: true,
          user: { id: user._id, fullName: user.fullName, email: user.email },
        });
      }
    }

    // Protect all dataset and order routes below
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Access denied. Invalid or missing token." });
    }
    const userId = decoded.id;

    // =========================================
    // 4. DATASET ROUTES: /api/datasets/*
    // =========================================
    if (url.includes("/datasets")) {
      // 4A. CSV FILE UPLOAD: POST /api/datasets/upload
      if (url.includes("/upload")) {
        if (method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

        const contentType = req.headers["content-type"] || "";
        if (!contentType.includes("multipart/form-data")) {
          return res.status(400).json({ message: "Content-Type must be multipart/form-data" });
        }

        const contentLength = parseInt(req.headers["content-length"] || "0", 10);
        const MAX_BYTES = 4.5 * 1024 * 1024;
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
            if (typeof filenameInfo === "string") {
              originalName = filenameInfo;
            } else if (filenameInfo && filenameInfo.filename) {
              originalName = filenameInfo.filename;
            } else if (filenameInfo && typeof filenameInfo === "object" && filenameInfo.name) {
              originalName = filenameInfo.name;
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

      // For other dataset routes, parse JSON body
      let body = {};
      if (["POST", "PATCH", "PUT"].includes(method)) {
        body = await parseRawBody(req);
      }

      // 4B. MANUAL DATASET: POST /api/datasets/manual
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

      // 4C. ACTIVE DATASET ANALYTICS: GET /api/datasets/active/analytics
      if (url.includes("/active/analytics")) {
        if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
        const result = await getActiveDatasetAnalytics(userId);
        return res.status(200).json(result);
      }

      // 4D. ACTIVE DATASET METADATA: GET /api/datasets/active
      if (url.endsWith("/active") || url.includes("/active?")) {
        if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
        const dataset = await getActiveDataset(userId);
        return res.status(200).json({ dataset });
      }

      // Matches /api/datasets/:id...
      const matches = url.match(/datasets\/([a-f0-9]{24})(.*)/i);
      if (matches) {
        const datasetId = matches[1];
        const subpath = matches[2] || "";

        // ACTIVATE: PATCH /api/datasets/:id/activate
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

        // RENAME: PATCH /api/datasets/:id/rename
        if (subpath.includes("/rename")) {
          if (method !== "PATCH") return res.status(405).json({ message: "Method Not Allowed" });
          const { name } = body;
          const dataset = await renameDataset(userId, datasetId, name);
          return res.status(200).json({ success: true, dataset });
        }

        // ROWS: GET /api/datasets/:id/rows
        if (subpath.includes("/rows")) {
          if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
          const page = parseInt(req.query.page || "1", 10);
          const limit = parseInt(req.query.limit || "50", 10);
          const result = await getDatasetRows(userId, datasetId, page, limit);
          return res.status(200).json(result);
        }

        // FILE: GET /api/datasets/:id/file
        if (subpath.includes("/file")) {
          if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
          const result = await getDatasetFile(userId, datasetId);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
          return res.status(200).send(result.content);
        }

        // EXPORT: GET /api/datasets/:id/export
        if (subpath.includes("/export")) {
          if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
          const result = await exportDatasetCsv(userId, datasetId);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
          return res.status(200).send(result.csvContent);
        }

        // DELETE: DELETE /api/datasets/:id
        if (method === "DELETE") {
          await deleteDataset(userId, datasetId);
          return res.status(200).json({ success: true, message: "Dataset deleted successfully" });
        }
      }

      // LIST ALL DATASETS: GET /api/datasets
      if (method === "GET") {
        const datasets = await getUserDatasets(userId);
        return res.status(200).json({ datasets });
      }
    }

    // =========================================
    // 5. ORDER ROUTES: /api/orders/*
    // =========================================
    if (url.includes("/orders")) {
      const matches = url.match(/orders\/([a-f0-9]{24})(.*)/i);
      if (matches) {
        const orderId = matches[1];
        const subpath = matches[2] || "";

        // UPDATE STATUS: PATCH /api/orders/:id/status
        if (subpath.includes("/status")) {
          if (method !== "PATCH") return res.status(405).json({ message: "Method Not Allowed" });
          const body = await parseRawBody(req);
          const { status, paymentMethod } = body;
          const order = await updateOrderStatus(userId, orderId, status, paymentMethod);
          return res.status(200).json({ success: true, order });
        }

        // RECEIPT PDF: GET /api/orders/:id/receipt
        if (subpath.includes("/receipt")) {
          if (method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });
          const pdfBuffer = await generateReceiptPdf(userId, orderId);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="receipt_${orderId}.pdf"`);
          return res.status(200).send(pdfBuffer);
        }
      }

      // CREATE ORDER: POST /api/orders
      if (method === "POST") {
        const body = await parseRawBody(req);
        const { items, totalAmount, customerInfo } = body;
        const order = await createOrder(userId, items, totalAmount, customerInfo);
        return res.status(201).json({ success: true, order });
      }

      // LIST ORDERS: GET /api/orders
      if (method === "GET") {
        const orders = await getUserOrders(userId);
        return res.status(200).json({ orders });
      }
    }

    return res.status(404).json({ message: "API Endpoint not found" });
  } catch (error) {
    console.error("API Error:", error);
    let msg = error.message || "Server Error";
    if (msg.includes("bad auth") || msg.includes("Authentication failed")) {
      msg = "MongoDB Atlas authentication failed. Please ensure your Database User password in Atlas is set to Pratik_123 under Database Access.";
    }
    return res.status(500).json({ message: msg });
  }
};
