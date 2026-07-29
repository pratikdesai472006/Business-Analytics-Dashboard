const express = require("express");
const cors = require("cors");
const compression = require("compression");
const cron = require("node-cron");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const datasetRoutes = require("./routes/datasetRoutes");
const connectDatabase = require("./config/db");
const { sendDueReminders } = require("./services/reminderService");

const app = express();

// ======================
// CORS Configuration
// ======================

const clientOrigin = process.env.CLIENT_ORIGIN || "";

const allowedOrigins = clientOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowAllOrigins =
  allowedOrigins.length === 0 || allowedOrigins.includes("*");

const allowVercelPreviews =
  process.env.ALLOW_VERCEL_PREVIEWS === "true";

console.log("CORS allowed origins:", allowAllOrigins ? ["*"] : allowedOrigins);
console.log("Allow Vercel previews:", allowVercelPreviews);

const corsOptions = {
  origin(origin, callback) {
    // Allow Postman, curl, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowAllOrigins) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (
      allowVercelPreviews &&
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    console.warn("Blocked CORS Origin:", origin);

    return callback(
      new Error(`Origin ${origin} is not allowed by CORS`)
    );
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.set("trust proxy", 1);

app.use(cors(corsOptions));
app.use(compression());

// IMPORTANT:
// Do NOT add app.options("/api/*", ...)
// Express 5 throws a PathError for that pattern.

app.use(express.json());

// ======================
// Request Logger
// ======================

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// ======================
// Routes
// ======================

app.use("/api/auth", authRoutes);
app.use("/api/orders", paymentRoutes);
app.use("/api/datasets", datasetRoutes);

// ======================
// Health Routes
// ======================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running successfully!",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
  });
});

// ======================
// Cron Job
// ======================

cron.schedule("0 9 * * *", () => {
  sendDueReminders().catch((error) => {
    console.error("Payment reminder failed:", error);
  });
});

// ======================
// Global Error Handler
// ======================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ======================
// Start Server
// ======================

const startServer = async () => {
  try {
    await connectDatabase();

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
};

startServer();